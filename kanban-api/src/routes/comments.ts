import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as commentController from '../controllers/comment.controller';

const router = Router();
router.use(authMiddleware);

// Nested: /api/cards/:id/comments
router.get('/cards/:id/comments', commentController.listComments);
router.post('/cards/:id/comments', commentController.addComment);

// Standalone: /api/comments/:id
router.put('/comments/:id', commentController.updateComment);
router.delete('/comments/:id', commentController.deleteComment);

export default router;
