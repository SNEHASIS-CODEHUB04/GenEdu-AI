'use client';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { MobileTopBar, MobileBottomBar } from './MobileNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

export default function DashboardLayout({ children, title, showBack }: DashboardLayoutProps) {
  const router = useRouter();
  return (
    <div className="min-h-screen" style={{ background: '#F2F2F2' }}>
      {/* Desktop layout */}
      <div className="hidden md:flex min-h-screen">
        <Sidebar />
        <div className="flex-1 ml-[220px] flex flex-col min-h-screen">
          <TopBar title={title} showBack={showBack} />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex flex-col min-h-screen md:hidden">
        <MobileTopBar title={title} showBack={showBack} onBack={() => router.back()} />
        <main className="flex-1 px-4 py-4 pb-24">{children}</main>
        <MobileBottomBar />
      </div>
    </div>
  );
}
