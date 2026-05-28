'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, FileText, BookOpen, Wrench, Bell, Menu, Plus } from 'lucide-react';

const tabs = [
  { label: 'Home', href: '/', icon: LayoutGrid },
  { label: 'Assignments', href: '/assignments', icon: FileText },
  { label: 'Library', href: '/library', icon: BookOpen },
  { label: 'AI Toolkit', href: '/toolkit', icon: Wrench },
];

interface MobileNavProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function MobileTopBar({ title, showBack, onBack }: MobileNavProps) {
  return (
    <header className="h-14 bg-white flex items-center justify-between px-4 sticky top-0 z-30 border-b border-gray-100">
      {showBack ? (
        <button onClick={onBack} className="p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1a1a1a' }}>
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">VedaAI</span>
        </div>
      )}

      {title && showBack && (
        <span className="font-semibold text-gray-900 text-base absolute left-1/2 -translate-x-1/2">{title}</span>
      )}

      <div className="flex items-center gap-3">
        <button className="relative p-1">
          <Bell size={20} className="text-gray-700" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center text-white text-xs font-bold">JD</div>
        </div>
        <button className="p-1">
          <Menu size={20} className="text-gray-700" />
        </button>
      </div>
    </header>
  );
}

export function MobileBottomBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-gray-900 flex items-center justify-around px-2 pb-safe" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
      {tabs.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link key={href} href={href} className="flex flex-col items-center gap-1 py-3 px-4 min-w-0">
            <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-white/10' : ''}`}>
              <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
            </div>
            <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileFAB({ href }: { href: string }) {
  return (
    <Link href={href}>
      <button
        className="fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center border border-gray-200"
        style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
      >
        <Plus size={22} className="text-gray-800" />
      </button>
    </Link>
  );
}
