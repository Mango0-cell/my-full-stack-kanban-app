import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as userController from '../controllers/user.controller';

const router = Router();

router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/password', userController.changePassword);
router.delete('/account', userController.deleteAccount);

export default router;
