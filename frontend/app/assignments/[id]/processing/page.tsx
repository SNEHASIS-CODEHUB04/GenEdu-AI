'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { use } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { connectJobWebSocket } from '@/lib/websocket';
import { assignmentsApi } from '@/lib/api';

export default function ProcessingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId') || '';
  const [progress, setProgress] = useState(5);
  const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing');
  const [errorMsg, setErrorMsg] = useState('');
  const doneRef = useRef(false); // prevent double-navigation

  useEffect(() => {
    if (!jobId) return;

    function handleUpdate(update: { status: string; progress: number; paperId?: string; error?: string }) {
      if (doneRef.current) return;

      if (update.status === 'completed') {
        doneRef.current = true;
        setProgress(100);
        setStatus('completed');
        setTimeout(() => router.push(`/assignments/${id}/paper`), 600);
      } else if (update.status === 'failed') {
        doneRef.current = true;
        setStatus('failed');
        setErrorMsg(update.error || 'Something went wrong. Please try again.');
      } else if (update.status === 'processing') {
        setProgress(update.progress ?? 40);
      }
    }

    // WebSocket for real-time updates
    const disconnect = connectJobWebSocket(jobId, handleUpdate);

    // Animate progress while waiting
    const ticker = setInterval(() => {
      setProgress((p) => (p < 85 ? p + 2 : p));
    }, 1200);

    // Polling fallback — starts after 2s, runs every 2.5s
    const poll = setInterval(async () => {
      if (doneRef.current) { clearInterval(poll); return; }
      try {
        const res = await assignmentsApi.getJobStatus(jobId);
        const { status: s, paperId } = res.data;
        if (s === 'completed' && paperId) {
          handleUpdate({ status: 'completed', progress: 100, paperId });
          clearInterval(poll);
        } else if (s === 'failed') {
          handleUpdate({ status: 'failed', progress: 0 });
          clearInterval(poll);
        }
      } catch { /* network hiccup, keep polling */ }
    }, 2500);

    return () => {
      disconnect();
      clearInterval(ticker);
      clearInterval(poll);
    };
  }, [jobId, id, router]);

  return (
    <DashboardLayout title="Assignment" showBack>
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        {/* Circular progress */}
        <div className="w-24 h-24 mb-6 relative">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="40" fill="none" stroke="#E5E7EB" strokeWidth="7" />
            <circle
              cx="48" cy="48" r="40" fill="none"
              stroke={status === 'failed' ? '#ef4444' : '#E8470A'}
              strokeWidth="7"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-gray-800">
            {progress}%
          </span>
        </div>

        {status === 'failed' ? (
          <>
            <h2 className="text-lg font-semibold text-red-600 mb-2">Generation Failed</h2>
            <p className="text-sm text-gray-500 mb-5 max-w-xs">{errorMsg}</p>
            <button
              onClick={() => router.push('/assignments/create')}
              className="px-6 py-2.5 rounded-full text-white text-sm font-medium"
              style={{ background: '#1a1a1a' }}
            >
              Try Again
            </button>
          </>
        ) : status === 'completed' ? (
          <>
            <h2 className="text-lg font-semibold text-green-600 mb-2">Done! Redirecting...</h2>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Generating Question Paper</h2>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              Our AI is crafting your question paper with proper sections, difficulty levels, and marks distribution.
            </p>
            <div className="flex gap-1.5 mt-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
