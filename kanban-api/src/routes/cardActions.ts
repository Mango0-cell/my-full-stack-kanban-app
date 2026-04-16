import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as cardController from '../controllers/card.controller';

const router = Router();
router.use(authMiddleware);

// Standalone card routes (by card_id)
router.get('/:id', cardController.getCard);
router.put('/:id', cardController.updateCard);
router.delete('/:id', cardController.deleteCard);
router.put('/:id/move', cardController.moveCard);

export default router;
