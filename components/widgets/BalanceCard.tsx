import Image, { StaticImageData } from 'next/image';

const BalanceCard = ({ 
  icon, 
  label, 
  amount, 
  currency = 'USD',
  textColor = ''
}: { 
  icon: StaticImageData; 
  label: string; 
  amount: number;
  currency?: string;
  textColor?: string;
}) => {
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl p-4 flex-1">
      <div className="flex items-center mb-2">
        <Image src={icon} alt="label" className="w-8 h-8" />
      </div>
      <p className="text-sm text-gray-500 mb-2 font-semibold">{label}</p>
      <p className={`text-2xl font-semibold ${textColor || (amount < 0 ? 'text-red-500' : '')}`}>
        {formatCurrency(amount, currency)}
      </p>
    </div>
  );
};

export default BalanceCard;