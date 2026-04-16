import { Request, Response, NextFunction } from 'express';
import * as commentService from '../services/comment.service';
import { validateRequired } from '../middleware/validator';

const p = (v: string | string[]): number => parseInt(Array.isArray(v) ? v[0] : v, 10);

export async function listComments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const comments = await commentService.listComments(p(req.params.id), req.user!.userId);
    res.json({ data: comments, message: 'OK', error: null });
  } catch (err) { next(err); }
}

export async function addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const content = validateRequired(req.body.content, 'content');
    const comment = await commentService.addComment(p(req.params.id), req.user!.userId, content);
    res.status(201).json({ data: comment, message: 'Comment added', error: null });
  } catch (err) { next(err); }
}

export async function updateComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const content = validateRequired(req.body.content, 'content');
    const comment = await commentService.updateComment(p(req.params.id), req.user!.userId, content);
    res.json({ data: comment, message: 'Comment updated', error: null });
  } catch (err) { next(err); }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await commentService.deleteComment(p(req.params.id), req.user!.userId);
    res.json({ data: null, message: 'Comment deleted', error: null });
  } catch (err) { next(err); }
}
