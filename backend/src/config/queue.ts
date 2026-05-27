import { EventEmitter } from 'events';
import { generateQuestionPaper } from '../services/aiService';
import Assignment from '../models/Assignment';
import QuestionPaper from '../models/QuestionPaper';
import { jobEmitter } from './jobEmitter';

// Simple in-process job queue — no Redis/BullMQ needed for local dev
const queue = new EventEmitter();

export function addGenerationJob(data: { assignmentId: string; jobId: string }) {
  // Run async, don't await
  processJob(data).catch((err) => {
    console.error('Job failed:', err);
    jobEmitter.emit(data.jobId, { jobId: data.jobId, status: 'failed', progress: 0, error: err.message });
  });
}

async function processJob({ assignmentId, jobId }: { assignmentId: string; jobId: string }) {
  jobEmitter.emit(jobId, { jobId, status: 'processing', progress: 10 });

  await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new Error('Assignment not found');

  jobEmitter.emit(jobId, { jobId, status: 'processing', progress: 40 });

  const generated = await generateQuestionPaper(
    assignment.questionTypes,
    assignment.additionalInstructions || '',
    assignment.fileText
  );

  jobEmitter.emit(jobId, { jobId, status: 'processing', progress: 80 });

  const paper = await QuestionPaper.create({
    assignmentId: assignment._id,
    schoolName: 'Delhi Public School, Sector-4, Bokaro',
    subject: generated.subject,
    className: generated.className,
    timeAllowed: generated.timeAllowed,
    maxMarks: generated.maxMarks,
    sections: generated.sections,
  });

  await Assignment.findByIdAndUpdate(assignmentId, { status: 'completed' });

  jobEmitter.emit(jobId, { jobId, status: 'completed', progress: 100, paperId: paper._id.toString() });
}

export { queue };
