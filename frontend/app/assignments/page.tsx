'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreVertical, Search, SlidersHorizontal, Plus } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { MobileFAB } from '@/components/MobileNav';
import { useAssignmentStore, Assignment } from '@/store/assignmentStore';
import { assignmentsApi } from '@/lib/api';
import { format } from 'date-fns';

function AssignmentCard({ assignment, onDelete }: { assignment: Assignment; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 relative shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-sm md:text-base pr-4 leading-snug">{assignment.title}</h3>
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <MoreVertical size={16} className="text-gray-400" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-100 z-20 min-w-[150px] py-1">
                <button
                  onClick={() => { setMenuOpen(false); router.push(`/assignments/${assignment._id}`); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  View Assignment
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onDelete(assignment._id); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {assignment.status === 'processing' && (
        <div className="mb-3 flex items-center gap-2 text-xs text-orange-600">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          Generating questions...
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
        <span>Assigned on : {format(new Date(assignment.createdAt), 'dd-MM-yyyy')}</span>
        <span>Due : {format(new Date(assignment.dueDate), 'dd-MM-yyyy')}</span>
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const { assignments, setAssignments, removeAssignment, setLoading, isLoading } = useAssignmentStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    assignmentsApi.getAll()
      .then((res) => setAssignments(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    await assignmentsApi.delete(id);
    removeAssignment(id);
  };

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Assignment">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (assignments.length === 0) {
    return (
      <DashboardLayout title="Assignment">
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
          {/* Illustration */}
          <div className="w-52 h-52 mb-6">
            <svg viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="110" cy="110" r="90" fill="#E8E8F0" />
              {/* Document */}
              <rect x="65" y="55" width="75" height="95" rx="8" fill="white" stroke="#D0D0E0" strokeWidth="2" />
              <line x1="80" y1="80" x2="125" y2="80" stroke="#C0C0D0" strokeWidth="3" strokeLinecap="round" />
              <line x1="80" y1="95" x2="118" y2="95" stroke="#C0C0D0" strokeWidth="3" strokeLinecap="round" />
              <line x1="80" y1="110" x2="122" y2="110" stroke="#C0C0D0" strokeWidth="3" strokeLinecap="round" />
              {/* Magnifier */}
              <circle cx="125" cy="130" r="32" fill="#EEEEF8" stroke="#C8C8DC" strokeWidth="2.5" />
              <line x1="108" y1="118" x2="142" y2="142" stroke="#E84040" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="142" y1="118" x2="108" y2="142" stroke="#E84040" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="148" y1="152" x2="165" y2="170" stroke="#C0C0D0" strokeWidth="5" strokeLinecap="round" />
              {/* Sparkles */}
              <path d="M60 155 L63 148 L66 155 L63 162 Z" fill="#6B8CFF" opacity="0.7" />
              <circle cx="155" cy="75" r="4" fill="#6B8CFF" opacity="0.5" />
              {/* Pen */}
              <path d="M55 70 Q50 60 58 55 Q66 50 68 62 Z" fill="#333" opacity="0.6" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">No assignments yet</h2>
          <p className="text-sm text-gray-500 max-w-xs mb-8 leading-relaxed">
            Create your first assignment to start collecting and grading student submissions. You can set up rubrics, define marking criteria, and let AI assist with grading.
          </p>
          <Link href="/assignments/create">
            <button
              className="flex items-center gap-2 px-7 py-3.5 rounded-full text-white text-sm font-semibold"
              style={{ background: '#1a1a1a' }}
            >
              <Plus size={16} />
              Create Your First Assignment
            </button>
          </Link>
        </div>
        <MobileFAB href="/assignments/create" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Assignment">
      {/* Desktop heading */}
      <div className="hidden md:block mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <h1 className="text-xl font-bold text-gray-900">Assignments</h1>
        </div>
        <p className="text-sm text-gray-500 ml-4">Manage and create assignments for your classes.</p>
      </div>

      {/* Mobile sub-header */}
      <div className="md:hidden flex items-center gap-3 mb-4">
        <Link href="/assignments" className="p-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="font-semibold text-gray-900 text-base">Assignments</h1>
      </div>

      {/* Filter + Search */}
      <div className="flex items-center gap-3 mb-4">
        <button className="flex items-center gap-2 text-sm text-gray-500 bg-white rounded-xl px-3 py-2.5 border border-gray-200 flex-shrink-0">
          <SlidersHorizontal size={14} />
          <span className="hidden sm:inline">Filter By</span>
          <span className="sm:hidden">Filter</span>
        </button>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </div>
      </div>

      {/* Cards — single col on mobile, 2 col on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pb-6">
        {filtered.map((a) => (
          <AssignmentCard key={a._id} assignment={a} onDelete={handleDelete} />
        ))}
      </div>

      {/* Desktop floating create */}
      <div className="hidden md:flex fixed bottom-8 left-1/2 -translate-x-1/2">
        <Link href="/assignments/create">
          <button
            className="flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-medium shadow-lg"
            style={{ background: '#1a1a1a' }}
          >
            <Plus size={16} />
            Create Assignment
          </button>
        </Link>
      </div>

      {/* Mobile FAB */}
      <MobileFAB href="/assignments/create" />
    </DashboardLayout>
  );
}
