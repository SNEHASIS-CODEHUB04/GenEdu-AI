import { create } from 'zustand';

export interface QuestionType {
  id: string;
  type: string;
  count: number;
  marks: number;
}

export interface Assignment {
  _id: string;
  title: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInstructions?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId?: string;
  createdAt: string;
}

export interface Question {
  number: number;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  answer?: string;
}

export interface Section {
  title: string;
  instruction: string;
  questionType: string;
  questions: Question[];
}

export interface QuestionPaper {
  _id: string;
  assignmentId: string;
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  sections: Section[];
}

interface AssignmentStore {
  assignments: Assignment[];
  currentPaper: QuestionPaper | null;
  isLoading: boolean;
  error: string | null;
  jobStatus: { jobId: string; status: string; progress: number; paperId?: string } | null;

  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;
  removeAssignment: (id: string) => void;
  setCurrentPaper: (paper: QuestionPaper | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setJobStatus: (status: AssignmentStore['jobStatus']) => void;
}

export const useAssignmentStore = create<AssignmentStore>((set) => ({
  assignments: [],
  currentPaper: null,
  isLoading: false,
  error: null,
  jobStatus: null,

  setAssignments: (assignments) => set({ assignments }),
  addAssignment: (assignment) =>
    set((state) => ({ assignments: [assignment, ...state.assignments] })),
  removeAssignment: (id) =>
    set((state) => ({ assignments: state.assignments.filter((a) => a._id !== id) })),
  setCurrentPaper: (paper) => set({ currentPaper: paper }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setJobStatus: (jobStatus) => set({ jobStatus }),
}));
