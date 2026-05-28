'use client';
import { Bell, ChevronDown, ArrowLeft, LayoutGrid } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
}

export default function TopBar({ title = 'Assignment', showBack = false }: TopBarProps) {
  const router = useRouter();
  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3 text-gray-500 text-sm">
        {showBack ? (
          <button onClick={() => router.back()} className="hover:text-gray-800 transition-colors">
            <ArrowLeft size={18} />
          </button>
        ) : (
          <ArrowLeft size={18} className="opacity-30" />
        )}
        <LayoutGrid size={16} />
        <span className="text-gray-700">{title}</span>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-1">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <button className="flex items-center gap-2 text-sm text-gray-700 font-medium">
          <div className="w-7 h-7 rounded-full bg-orange-200 flex items-center justify-center text-xs">JD</div>
          John Doe
          <ChevronDown size={14} />
        </button>
      </div>
    </header>
  );
}
