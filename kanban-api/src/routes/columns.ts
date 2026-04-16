import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as columnController from '../controllers/column.controller';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

router.get('/', columnController.listColumns);
router.post('/', columnController.createColumn);
router.put('/:cid', columnController.updateColumn);
router.delete('/:cid', columnController.deleteColumn);

export default router;
