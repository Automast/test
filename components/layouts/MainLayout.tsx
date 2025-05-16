import { ReactNode } from 'react';
import { MainNavbar } from '@/components/widgets';

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <MainNavbar />
      <main className="flex-grow">{children}</main>
    </div>
  );
};

export default MainLayout;
