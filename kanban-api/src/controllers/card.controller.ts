import { Request, Response, NextFunction } from 'express';
import * as cardService from '../services/card.service';
import { validateRequired } from '../middleware/validator';
import { ValidationError } from '../utils/errors';

const p = (v: string | string[]): number => parseInt(Array.isArray(v) ? v[0] : v, 10);

export async function listCardsByProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cards = await cardService.listCardsByProject(p(req.params.id), req.user!.userId);
    res.json({ data: cards, message: 'OK', error: null });
  } catch (err) { next(err); }
}

export async function listCards(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const cards = await cardService.listCards(p(req.params.cid), req.user!.userId);
    res.json({ data: cards, message: 'OK', error: null });
  } catch (err) { next(err); }
}

export async function createCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const title = validateRequired(req.body.title, 'title');
    const card = await cardService.createCard(p(req.params.cid), req.user!.userId, { ...req.body, title });
    res.status(201).json({ data: card, message: 'Card created', error: null });
  } catch (err) { next(err); }
}

export async function getCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const card = await cardService.getCard(p(req.params.id), req.user!.userId);
    res.json({ data: card, message: 'OK', error: null });
  } catch (err) { next(err); }
}

export async function updateCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const card = await cardService.updateCard(p(req.params.id), req.user!.userId, req.body);
    res.json({ data: card, message: 'Card updated', error: null });
  } catch (err) { next(err); }
}

export async function deleteCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await cardService.deleteCard(p(req.params.id), req.user!.userId);
    res.json({ data: null, message: 'Card deleted', error: null });
  } catch (err) { next(err); }
}

export async function moveCard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const columnId = req.body.column_id;
    const position = req.body.position;
    if (typeof columnId !== 'number') throw new ValidationError('column_id must be a number');
    if (typeof position !== 'number') throw new ValidationError('position must be a number');
    const card = await cardService.moveCard(p(req.params.id), req.user!.userId, columnId, position);
    res.json({ data: card, message: 'Card moved', error: null });
  } catch (err) { next(err); }
}
