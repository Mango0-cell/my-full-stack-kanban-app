import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as activityController from '../controllers/activity.controller';

const router = Router();
router.use(authMiddleware);

router.get('/cards/:id/activity', activityController.getActivity);

export default router;
