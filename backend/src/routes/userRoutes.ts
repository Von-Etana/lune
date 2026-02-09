import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as userController from '../controllers/userController';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/:id', userController.getUserProfile);
router.put('/:id', userController.updateUserProfile);
router.post('/:id/video', userController.uploadVideoIntro);
router.get('/:id/certifications', userController.getUserCertifications);

export default router;
