import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse') as { PDFParse: new (opts: { data: Buffer }) => { getText: () => Promise<{ text: string }> } };
import Assignment from '../models/Assignment';
import QuestionPaper from '../models/QuestionPaper';
import { addGenerationJob } from '../config/queue';
import { jobEmitter } from '../config/jobEmitter';

const router = Router();

// In-memory job status store (good enough for dev; use Redis in prod)
const jobStatusMap = new Map<string, { status: string; paperId?: string }>();

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// GET all assignments
router.get('/', async (_req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    res.json({ success: true, data: assignments });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch assignments' });
  }
});

// GET job status — must be before /:id to avoid conflict
router.get('/job/:jobId/status', (req: Request, res: Response) => {
  const jobId = String(req.params.jobId);
  const entry = jobStatusMap.get(jobId);
  res.json({ success: true, status: entry?.status || 'pending', paperId: entry?.paperId });
});

// GET single assignment
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: assignment });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch assignment' });
  }
});

// GET question paper for assignment
router.get('/:id/paper', async (req: Request, res: Response) => {
  try {
    const paper = await QuestionPaper.findOne({ assignmentId: req.params.id });
    if (!paper) return res.status(404).json({ success: false, error: 'Paper not found' });
    res.json({ success: true, data: paper });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch paper' });
  }
});

// POST create assignment
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { title, dueDate, questionTypes, additionalInstructions } = req.body;

    if (!title || !dueDate || !questionTypes) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const parsedTypes = typeof questionTypes === 'string' ? JSON.parse(questionTypes) : questionTypes;

    for (const qt of parsedTypes) {
      if (!qt.type || qt.count < 1 || qt.marks < 1) {
        return res.status(400).json({ success: false, error: 'Invalid question type data' });
      }
    }

    let fileText: string | undefined;
    let fileUrl: string | undefined;

    if (req.file) {
      fileUrl = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();

      if (ext === '.txt') {
        fileText = fs.readFileSync(req.file.path, 'utf-8');
      } else if (ext === '.pdf') {
        try {
          const buffer = fs.readFileSync(req.file.path);
          const parser = new PDFParse({ data: buffer });
          const result = await parser.getText();
          fileText = result?.text?.trim();
          if (fileText && fileText.length > 6000) fileText = fileText.slice(0, 6000);
          console.log(`PDF extracted: ${fileText?.length || 0} chars`);
        } catch (e) {
          console.error('PDF parse error:', e);
          // Continue without text — AI will generate from title/instructions
        }
      }
      // Images: no text extraction (would need OCR), AI generates from title/instructions
    }

    const jobId = uuidv4();
    const assignment = await Assignment.create({
      title,
      dueDate: new Date(dueDate),
      questionTypes: parsedTypes,
      additionalInstructions,
      fileUrl,
      fileText,
      status: 'pending',
      jobId,
    });

    // Track job status
    jobStatusMap.set(jobId, { status: 'pending' });

    // Listen for updates and keep map in sync
    jobEmitter.on(jobId, (data: { status: string; paperId?: string }) => {
      jobStatusMap.set(jobId, { status: data.status, paperId: data.paperId });
    });

    // Delay job start by 1.5s so the frontend WebSocket has time to connect
    setTimeout(() => {
      addGenerationJob({ assignmentId: assignment._id.toString(), jobId });
    }, 1500);

    res.status(201).json({ success: true, data: assignment, jobId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to create assignment' });
  }
});

// DELETE assignment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    await QuestionPaper.deleteOne({ assignmentId: req.params.id });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete assignment' });
  }
});

export default router;
