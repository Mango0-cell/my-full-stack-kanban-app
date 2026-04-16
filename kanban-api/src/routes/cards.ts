import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as cardController from '../controllers/card.controller';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

// Nested under /api/columns/:cid/cards
router.get('/', cardController.listCards);
router.post('/', cardController.createCard);

export default router;
