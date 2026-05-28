'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, FileText, Wrench, BookOpen, Settings, Plus } from 'lucide-react';
import { useAssignmentStore } from '@/store/assignmentStore';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'My Groups', href: '/groups', icon: Users },
  { label: 'Assignments', href: '/assignments', icon: FileText },
  { label: "AI Teacher's Toolkit", href: '/toolkit', icon: Wrench },
  { label: 'My Library', href: '/library', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const assignments = useAssignmentStore((s) => s.assignments);

  return (
    <aside className="w-[220px] min-h-screen bg-white flex flex-col border-r border-gray-100 fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#E8470A' }}>
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">VedaAI</span>
        </div>
      </div>

      {/* Create Button */}
      <div className="px-4 mb-6">
        <Link href="/assignments/create">
          <button
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)' }}
          >
            <Plus size={16} />
            Create Assignment
          </button>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}>
              <div
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors ${
                  isActive ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? 'text-gray-900' : 'text-gray-500'} />
                  {label}
                </div>
                {label === 'Assignments' && assignments.length > 0 && (
                  <span
                    className="text-xs text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                    style={{ background: '#E8470A' }}
                  >
                    {assignments.length}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-1">
        <Link href="/settings">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
            <Settings size={16} className="text-gray-500" />
            Settings
          </div>
        </Link>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 mt-2">
          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
            <span className="text-lg">🏫</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900">Delhi Public School</p>
            <p className="text-xs text-gray-500">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
