'use client';
import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { FileText, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { assignmentsApi } from '@/lib/api';
import { Assignment } from '@/store/assignmentStore';

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Pending' },
  processing: { icon: Loader, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Processing' },
  completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Failed' },
};

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    assignmentsApi.getById(id)
      .then((res) => setAssignment(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout title="Assignment" showBack>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!assignment) return null;

  const sc = statusConfig[assignment.status];
  const StatusIcon = sc.icon;
  const totalMarks = assignment.questionTypes.reduce((s, q) => s + q.count * q.marks, 0);
  const totalQuestions = assignment.questionTypes.reduce((s, q) => s + q.count, 0);

  return (
    <DashboardLayout title="Assignment" showBack>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{assignment.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Created {format(new Date(assignment.createdAt), 'dd MMM yyyy')} · Due {format(new Date(assignment.dueDate), 'dd MMM yyyy')}
              </p>
            </div>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${sc.bg} ${sc.color}`}>
              <StatusIcon size={13} className={assignment.status === 'processing' ? 'animate-spin' : ''} />
              {sc.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Total Questions</p>
              <p className="font-bold text-gray-900 text-lg">{totalQuestions}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-500 text-xs mb-1">Total Marks</p>
              <p className="font-bold text-gray-900 text-lg">{totalMarks}</p>
            </div>
          </div>
        </div>

        {/* Question Types */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Question Breakdown</h2>
          <div className="space-y-3">
            {assignment.questionTypes.map((qt, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <FileText size={15} className="text-gray-400" />
                  <span className="text-sm text-gray-700">{qt.type}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{qt.count} questions</span>
                  <span>{qt.marks} marks each</span>
                  <span className="font-medium text-gray-700">{qt.count * qt.marks} marks</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {assignment.status === 'completed' && (
          <button
            onClick={() => router.push(`/assignments/${id}/paper`)}
            className="w-full py-3 rounded-2xl text-white font-medium text-sm"
            style={{ background: '#E8470A' }}
          >
            View Question Paper
          </button>
        )}
      </div>
    </DashboardLayout>
  );
}
