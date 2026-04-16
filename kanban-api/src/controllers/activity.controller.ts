import { Request, Response, NextFunction } from 'express';
import * as activityService from '../services/activity.service';

const p = (v: string | string[]): number => parseInt(Array.isArray(v) ? v[0] : v, 10);

export async function getActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const activity = await activityService.getCardActivity(p(req.params.id), req.user!.userId);
    res.json({ data: activity, message: 'OK', error: null });
  } catch (err) { next(err); }
}
