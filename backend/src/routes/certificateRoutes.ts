import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import * as certificateController from '../controllers/certificateController';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/mint', requireRole(['candidate']), certificateController.mintCertificate);
router.get('/verify/:hash', certificateController.verifyCertificate);
router.get('/:id', certificateController.getCertificate);
router.get('/', certificateController.getUserCertificates);

export default router;
