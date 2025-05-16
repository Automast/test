import { MainLayout } from '@/components/layouts';

export default function Home() {
  return (
    <MainLayout>
      <main className="flex flex-col gap-[32px] row-start-2 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-[32px] items-center justify-center">
          <h1 className="text-4xl font-bold">Welcome to ArkusPay!</h1>
          <p className="text-lg text-center">
            We provide easy and simple ways to pay with credit cards, cryptocurrency, and bank transfers.
          </p>
        </div>
      </main>
    </MainLayout>
  );
}
