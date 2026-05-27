import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { connectRedis, redisClient } from '../config/redis';
import { generateQuestionPaper } from '../services/aiService';
import Assignment from '../models/Assignment';
import QuestionPaper from '../models/QuestionPaper';

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

async function bootstrap() {
  await connectDB();
  await connectRedis();

  const worker = new Worker(
    'question-generation',
    async (job) => {
      const { assignmentId, jobId } = job.data;

      // Update status to processing
      await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });
      await redisClient.set(`job:${jobId}:status`, 'processing', 'EX', 3600);

      // Notify via Redis pub/sub (WebSocket server subscribes)
      await redisClient.publish('job-updates', JSON.stringify({ jobId, status: 'processing', progress: 10 }));

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) throw new Error('Assignment not found');

      await redisClient.publish('job-updates', JSON.stringify({ jobId, status: 'processing', progress: 40 }));

      // Generate question paper
      const generated = await generateQuestionPaper(
        assignment.questionTypes,
        assignment.additionalInstructions || '',
        assignment.fileText
      );

      await redisClient.publish('job-updates', JSON.stringify({ jobId, status: 'processing', progress: 80 }));

      // Save to DB
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
      await redisClient.set(`job:${jobId}:status`, 'completed', 'EX', 3600);
      await redisClient.set(`job:${jobId}:paperId`, paper._id.toString(), 'EX', 3600);

      await redisClient.publish(
        'job-updates',
        JSON.stringify({ jobId, status: 'completed', progress: 100, paperId: paper._id.toString() })
      );

      return { paperId: paper._id.toString() };
    },
    { connection }
  );

  worker.on('failed', async (job, err) => {
    if (job) {
      const { assignmentId, jobId } = job.data;
      await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
      await redisClient.set(`job:${jobId}:status`, 'failed', 'EX', 3600);
      await redisClient.publish('job-updates', JSON.stringify({ jobId, status: 'failed', error: err.message }));
    }
  });

  console.log('Question generation worker started');
}

bootstrap().catch(console.error);
