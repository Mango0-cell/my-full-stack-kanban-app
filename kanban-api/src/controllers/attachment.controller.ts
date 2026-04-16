import { Request, Response, NextFunction } from 'express';
import * as attachmentService from '../services/attachment.service';
import { validateRequired } from '../middleware/validator';

const p = (v: string | string[]): number => parseInt(Array.isArray(v) ? v[0] : v, 10);

export async function listAttachments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const attachments = await attachmentService.listAttachments(p(req.params.id), req.user!.userId);
    res.json({ data: attachments, message: 'OK', error: null });
  } catch (err) { next(err); }
}

export async function addAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const fileUrl = validateRequired(req.body.file_url, 'file_url');
    const fileName = validateRequired(req.body.file_name, 'file_name');
    const attachment = await attachmentService.addAttachment(p(req.params.id), req.user!.userId, fileUrl, fileName);
    res.status(201).json({ data: attachment, message: 'Attachment added', error: null });
  } catch (err) { next(err); }
}

export async function deleteAttachment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await attachmentService.deleteAttachment(p(req.params.id), req.user!.userId);
    res.json({ data: null, message: 'Attachment deleted', error: null });
  } catch (err) { next(err); }
}
