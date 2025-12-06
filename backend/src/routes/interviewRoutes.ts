import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import * as interviewController from '../controllers/interviewController';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/start', requireRole(['candidate']), interviewController.startInterview);
router.post('/answer', requireRole(['candidate']), interviewController.submitAnswer);
router.get('/history', requireRole(['candidate']), interviewController.getInterviewHistory);
router.get('/:id/feedback', requireRole(['candidate']), interviewController.getFeedback);

export default router;
