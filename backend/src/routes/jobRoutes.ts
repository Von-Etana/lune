import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import * as jobController from '../controllers/jobController';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', jobController.getJobs);
router.post('/', requireRole(['employer']), jobController.createJob);
router.get('/:id/candidates', requireRole(['employer']), jobController.getMatchedCandidates);

export default router;
