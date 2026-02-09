import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);

// Protected routes
router.get('/me', authController.getCurrentUser);

export default router;
