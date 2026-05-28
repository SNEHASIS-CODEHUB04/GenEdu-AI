'use client';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Upload, Plus, Minus, X, Mic, ChevronDown, ArrowLeft, ArrowRight } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAssignmentStore } from '@/store/assignmentStore';
import { assignmentsApi } from '@/lib/api';
import { connectJobWebSocket } from '@/lib/websocket';

const QUESTION_TYPE_OPTIONS = [
  'Multiple Choice Questions',
  'Short Questions',
  'Long Questions',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'Fill in the Blanks',
  'True/False',
  'Match the Following',
];

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  additionalInstructions: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface QType {
  id: string;
  type: string;
  count: number;
  marks: number;
}

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 flex-shrink-0"
      >
        <Minus size={11} />
      </button>
      <span className="w-6 text-center text-sm font-semibold">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 flex-shrink-0"
      >
        <Plus size={11} />
      </button>
    </div>
  );
}

export default function CreateAssignmentPage() {
  const router = useRouter();
  const { addAssignment, setJobStatus } = useAssignmentStore();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [questionTypes, setQuestionTypes] = useState<QType[]>([
    { id: uuidv4(), type: 'Multiple Choice Questions', count: 4, marks: 1 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', dueDate: '', additionalInstructions: '' },
  });

  const totalQuestions = questionTypes.reduce((s, q) => s + q.count, 0);
  const totalMarks = questionTypes.reduce((s, q) => s + q.count * q.marks, 0);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  const addQuestionType = () =>
    setQuestionTypes((prev) => [...prev, { id: uuidv4(), type: 'Short Questions', count: 3, marks: 2 }]);

  const removeQuestionType = (id: string) =>
    setQuestionTypes((prev) => prev.filter((q) => q.id !== id));

  const updateQType = (id: string, field: keyof QType, value: string | number) =>
    setQuestionTypes((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)));

  const onSubmit = async (data: FormData) => {
    if (questionTypes.length === 0) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('dueDate', data.dueDate);
      formData.append('questionTypes', JSON.stringify(questionTypes.map(({ id, ...rest }) => rest)));
      if (data.additionalInstructions) formData.append('additionalInstructions', data.additionalInstructions);
      if (file) formData.append('file', file);

      const res = await assignmentsApi.create(formData);
      const { data: assignment, jobId } = res.data;
      addAssignment(assignment);

      const disconnect = connectJobWebSocket(jobId, (update) => {
        setJobStatus({ jobId, status: update.status, progress: update.progress, paperId: update.paperId });
        if (update.status === 'completed' && update.paperId) {
          disconnect();
          router.push(`/assignments/${assignment._id}/paper`);
        } else if (update.status === 'failed') {
          disconnect();
          router.push(`/assignments/${assignment._id}`);
        }
      });

      router.push(`/assignments/${assignment._id}/processing?jobId=${jobId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Create Assignment" showBack>
      <div className="max-w-2xl mx-auto">
        {/* Desktop heading */}
        <div className="hidden md:block mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <h1 className="text-xl font-bold text-gray-900">Create Assignment</h1>
          </div>
          <p className="text-sm text-gray-500 ml-4">Set up a new assignment for your students</p>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-200 rounded-full mb-5">
          <div className="h-1 bg-gray-800 rounded-full w-1/2" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm space-y-5">
            <div>
              <h2 className="font-semibold text-gray-900 text-base">Assignment Details</h2>
              <p className="text-xs text-gray-500 mt-0.5">Basic information about your assignment</p>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Assignment Title</label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    placeholder="e.g. Quiz on Electricity"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                )}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>

            {/* File Upload */}
            <div>
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  isDragging ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={26} className="mx-auto mb-2 text-gray-400" />
                {file ? (
                  <p className="text-sm font-medium text-gray-700">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-1">Choose a file or drag & drop it here</p>
                    <p className="text-xs text-gray-400 mb-3">JPEG, PNG, upto 10MB</p>
                    <button type="button" className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                      Browse Files
                    </button>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400 text-center mt-1.5">Upload images of your preferred document/image</p>
              <input ref={fileInputRef} type="file" accept=".pdf,.txt,.png,.jpg,.jpeg" className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <input
                      {...field}
                      type="date"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </div>
                )}
              />
              {errors.dueDate && <p className="text-xs text-red-500 mt-1">{errors.dueDate.message}</p>}
            </div>

            {/* Question Types */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Question Type</p>

              <div className="space-y-3">
                {questionTypes.map((qt) => (
                  <div key={qt.id} className="border border-gray-200 rounded-xl p-3 space-y-3">
                    {/* Type selector row */}
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <select
                          value={qt.type}
                          onChange={(e) => updateQType(qt.id, 'type', e.target.value)}
                          className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-orange-200 bg-white"
                        >
                          {QUESTION_TYPE_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
                        </select>
                        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                      <button type="button" onClick={() => removeQuestionType(qt.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0">
                        <X size={14} className="text-gray-400" />
                      </button>
                    </div>

                    {/* Steppers row — labeled on mobile */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <p className="text-xs text-gray-500 mb-2">No. of Questions</p>
                        <Stepper value={qt.count} onChange={(v) => updateQType(qt.id, 'count', v)} />
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2.5">
                        <p className="text-xs text-gray-500 mb-2">Marks</p>
                        <Stepper value={qt.marks} onChange={(v) => updateQType(qt.id, 'marks', v)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addQuestionType}
                className="flex items-center gap-2 mt-4 text-sm text-gray-700 font-medium hover:text-gray-900">
                <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center">
                  <Plus size={14} className="text-white" />
                </div>
                Add Question Type
              </button>

              <div className="text-right text-sm text-gray-600 mt-3 space-y-0.5">
                <p>Total Questions : <span className="font-semibold">{totalQuestions}</span></p>
                <p>Total Marks : <span className="font-semibold">{totalMarks}</span></p>
              </div>
            </div>

            {/* Additional Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Additional Information <span className="text-gray-400 font-normal">(For better output)</span>
              </label>
              <Controller
                name="additionalInstructions"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <textarea
                      {...field}
                      rows={4}
                      placeholder="e.g Generate a question paper for 3 hour exam duration..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 resize-none"
                    />
                    <Mic size={16} className="absolute bottom-3 right-3 text-gray-400" />
                  </div>
                )}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-5 mb-2">
            <button type="button" onClick={() => router.back()}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <ArrowLeft size={15} />
              Previous
            </button>
            <button
              type="submit"
              disabled={isSubmitting || questionTypes.length === 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-medium disabled:opacity-60"
              style={{ background: '#1a1a1a' }}
            >
              {isSubmitting
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><span>Next</span> <ArrowRight size={15} /></>
              }
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
