import { Request, Response, NextFunction } from 'express';
import * as columnService from '../services/column.service';
import { validateRequired } from '../middleware/validator';

const p = (v: string | string[]): number => parseInt(Array.isArray(v) ? v[0] : v, 10);

export async function listColumns(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const columns = await columnService.listColumns(p(req.params.id), req.user!.userId);
    res.json({ data: columns, message: 'OK', error: null });
  } catch (err) { next(err); }
}

export async function createColumn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const name = validateRequired(req.body.name, 'name');
    const col = await columnService.createColumn(p(req.params.id), req.user!.userId, name, req.body.position);
    res.status(201).json({ data: col, message: 'Column created', error: null });
  } catch (err) { next(err); }
}

export async function updateColumn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const col = await columnService.updateColumn(
      p(req.params.id), p(req.params.cid), req.user!.userId, req.body
    );
    res.json({ data: col, message: 'Column updated', error: null });
  } catch (err) { next(err); }
}

export async function deleteColumn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await columnService.deleteColumn(p(req.params.id), p(req.params.cid), req.user!.userId);
    res.json({ data: null, message: 'Column deleted', error: null });
  } catch (err) { next(err); }
}
