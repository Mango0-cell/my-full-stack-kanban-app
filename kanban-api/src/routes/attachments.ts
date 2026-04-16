import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as attachmentController from '../controllers/attachment.controller';

const router = Router();
router.use(authMiddleware);

// Nested: /api/cards/:id/attachments
router.get('/cards/:id/attachments', attachmentController.listAttachments);
router.post('/cards/:id/attachments', attachmentController.addAttachment);

// Standalone: /api/attachments/:id
router.delete('/attachments/:id', attachmentController.deleteAttachment);

export default router;
