import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import QuestionPaper from '../models/QuestionPaper';
import Assignment from '../models/Assignment';
import { addGenerationJob } from '../config/queue';

const router = Router();

// GET paper by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id).populate('assignmentId');
    if (!paper) return res.status(404).json({ success: false, error: 'Paper not found' });
    res.json({ success: true, data: paper });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch paper' });
  }
});

// POST regenerate
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const paper = await QuestionPaper.findById(req.params.id);
    if (!paper) return res.status(404).json({ success: false, error: 'Paper not found' });

    const assignment = await Assignment.findById(paper.assignmentId);
    if (!assignment) return res.status(404).json({ success: false, error: 'Assignment not found' });

    await QuestionPaper.findByIdAndDelete(req.params.id);

    const jobId = uuidv4();
    assignment.status = 'pending';
    assignment.jobId = jobId;
    await assignment.save();

    addGenerationJob({ assignmentId: assignment._id.toString(), jobId });

    res.json({ success: true, jobId });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to regenerate' });
  }
});

export default router;
