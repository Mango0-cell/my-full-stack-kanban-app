import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as projectController from '../controllers/project.controller';
import * as cardController from '../controllers/card.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', projectController.listProjects);
router.post('/', projectController.createProject);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

router.get('/:id/cards', cardController.listCardsByProject);
router.get('/:id/members', projectController.listMembers);
router.post('/:id/members', projectController.addMember);
router.put('/:id/members/:uid', projectController.updateMemberRole);
router.delete('/:id/members/:uid', projectController.removeMember);

export default router;
