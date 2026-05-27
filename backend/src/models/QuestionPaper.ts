import mongoose, { Schema, Document } from 'mongoose';

export interface IQuestion {
  number: number;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  answer?: string;
}

export interface ISection {
  title: string;
  instruction: string;
  questionType: string;
  questions: IQuestion[];
}

export interface IQuestionPaper extends Document {
  assignmentId: mongoose.Types.ObjectId;
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  maxMarks: number;
  sections: ISection[];
  createdAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  number: Number,
  text: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  marks: { type: Number, required: true },
  answer: String,
});

const SectionSchema = new Schema<ISection>({
  title: String,
  instruction: String,
  questionType: String,
  questions: [QuestionSchema],
});

const QuestionPaperSchema = new Schema<IQuestionPaper>(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    schoolName: { type: String, default: 'Delhi Public School, Sector-4, Bokaro' },
    subject: String,
    className: String,
    timeAllowed: String,
    maxMarks: Number,
    sections: [SectionSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IQuestionPaper>('QuestionPaper', QuestionPaperSchema);
