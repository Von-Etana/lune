import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import * as assessmentController from '../controllers/assessmentController';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/generate', requireRole(['candidate']), assessmentController.generateAssessment);
router.post('/submit', requireRole(['candidate']), assessmentController.submitAssessment);
router.get('/history', requireRole(['candidate']), assessmentController.getAssessmentHistory);
router.get('/:id', assessmentController.getAssessment);
router.post('/:id/proctor', requireRole(['candidate']), assessmentController.submitProctoringEvents);

export default router;
