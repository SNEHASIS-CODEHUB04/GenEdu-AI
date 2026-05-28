'use client';
import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Download, RefreshCw, ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { assignmentsApi, questionsApi } from '@/lib/api';
import { QuestionPaper } from '@/store/assignmentStore';
import { downloadPaperAsPDF } from '@/components/PaperPDF';

const difficultyConfig = {
  easy:   { label: 'Easy',       bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200' },
  medium: { label: 'Moderate',   bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  hard:   { label: 'Challenging',bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200' },
};

export default function PaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    Promise.all([
      assignmentsApi.getPaper(id),
      assignmentsApi.getById(id),
    ])
      .then(([paperRes, assignmentRes]) => {
        setPaper(paperRes.data.data);
        setAssignmentTitle(assignmentRes.data.data?.title || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleRegenerate = async () => {
    if (!paper) return;
    setRegenerating(true);
    try {
      const res = await questionsApi.regenerate(paper._id);
      router.push(`/assignments/${id}/processing?jobId=${res.data.jobId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!paper) return;
    setDownloading(true);
    try {
      await downloadPaperAsPDF(paper, showAnswers);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Assignment" showBack>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!paper) {
    return (
      <DashboardLayout title="Assignment" showBack>
        <div className="text-center py-20 text-gray-500">Paper not found.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Create New" showBack>
      {/* Action Banner */}
      <div className="rounded-2xl p-4 mb-4 flex flex-col sm:flex-row sm:items-start gap-3" style={{ background: '#1a1a1a' }}>
        <p className="text-white text-sm leading-relaxed flex-1">
          Here is your customized question paper for <span className="font-semibold">"{assignmentTitle || paper.subject}"</span> — {paper.subject} · Class {paper.className} · {paper.maxMarks} Marks
        </p>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-xl border border-white/20 flex-shrink-0 self-start disabled:opacity-60"
        >
          {downloading
            ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Download size={14} />
          }
          {downloading ? 'Generating...' : 'Download as PDF'}
        </button>
      </div>

      {/* Paper */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="text-center py-6 px-4 md:px-8 border-b border-gray-100">
          <h1 className="text-base md:text-xl font-bold text-gray-900 mb-1">{paper.schoolName}</h1>
          <p className="text-sm text-gray-700">Subject: {paper.subject}</p>
          <p className="text-sm text-gray-700">Class: {paper.className}</p>
        </div>

        <div className="px-4 md:px-8 py-5">
          {/* Meta */}
          <div className="flex items-center justify-between mb-3 text-xs md:text-sm text-gray-700">
            <span>Time Allowed: {paper.timeAllowed}</span>
            <span>Maximum Marks: {paper.maxMarks}</span>
          </div>

          <p className="text-xs md:text-sm text-gray-600 mb-4 italic">
            All questions are compulsory unless stated otherwise.
          </p>

          {/* Student Info */}
          <div className="space-y-2 mb-6 text-sm text-gray-800">
            <p className="flex items-center gap-2">
              Name:
              <span className="flex-1 border-b border-gray-400" />
            </p>
            <p className="flex items-center gap-2">
              Roll Number:
              <span className="flex-1 border-b border-gray-400" />
            </p>
            <p className="flex items-center gap-2">
              Class: {paper.className} Section:
              <span className="flex-1 border-b border-gray-400" />
            </p>
          </div>

          {/* Sections */}
          {paper.sections.map((section, si) => (
            <div key={si} className="mb-7">
              <h2 className="text-center text-sm md:text-base font-bold text-gray-900 mb-2">{section.title}</h2>
              <p className="font-semibold text-sm text-gray-800 mb-0.5">{section.questionType}</p>
              <p className="text-xs text-gray-500 italic mb-4">{section.instruction}</p>

              <ol className="space-y-4">
                {section.questions.map((q, qi) => {
                  const diff = difficultyConfig[q.difficulty] || difficultyConfig.medium;
                  return (
                    <li key={qi} className="flex gap-2">
                      <span className="text-sm text-gray-700 flex-shrink-0 font-medium pt-0.5">{q.number}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start gap-1.5 mb-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${diff.bg} ${diff.text} ${diff.border}`}>
                            {diff.label}
                          </span>
                          <span className="text-xs md:text-sm text-gray-500 flex-shrink-0 font-medium">[{q.marks} Marks]</span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed">{q.text}</p>
                        {showAnswers && q.answer && (
                          <div className="mt-2 pl-2 border-l-2 border-green-300 text-xs text-gray-600 bg-green-50 rounded-r-lg p-2">
                            <span className="font-medium text-green-700">Answer: </span>{q.answer}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}

          <p className="text-center text-sm font-semibold text-gray-700 mt-6 pt-4 border-t border-gray-100">
            End of Question Paper
          </p>

          {/* Answer Key Toggle */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button onClick={() => setShowAnswers(!showAnswers)}
              className="text-sm font-medium" style={{ color: '#E8470A' }}>
              {showAnswers ? 'Hide Answer Key' : 'Show Answer Key'}
            </button>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between mt-5 mb-2 print:hidden">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-full text-sm text-gray-700 bg-white hover:bg-gray-50">
          <ArrowLeft size={15} />
          Back
        </button>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-medium disabled:opacity-60"
          style={{ background: '#E8470A' }}
        >
          {regenerating
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><RefreshCw size={14} /> Regenerate</>
          }
        </button>
      </div>

    </DashboardLayout>
  );
}
