import { Request, Response, NextFunction } from 'express';
import * as projectService from '../services/project.service';
import { validateRequired } from '../middleware/validator';

const p = (v: string | string[]): number => parseInt(Array.isArray(v) ? v[0] : v, 10);

export async function listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projects = await projectService.listProjects(req.user!.userId);
    res.json({ data: projects, message: 'OK', error: null });
  } catch (err) { next(err); }
}

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projectName = validateRequired(req.body.project_name, 'project_name');
    const project = await projectService.createProject(req.user!.userId, projectName, req.body.description);
    res.status(201).json({ data: project, message: 'Project created', error: null });
  } catch (err) { next(err); }
}

export async function getProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectService.getProject(p(req.params.id), req.user!.userId);
    res.json({ data: project, message: 'OK', error: null });
  } catch (err) { next(err); }
}

export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectService.updateProject(p(req.params.id), req.user!.userId, req.body);
    res.json({ data: project, message: 'Project updated', error: null });
  } catch (err) { next(err); }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await projectService.deleteProject(p(req.params.id), req.user!.userId);
    res.json({ data: null, message: 'Project deleted', error: null });
  } catch (err) { next(err); }
}

export async function listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const members = await projectService.listMembers(p(req.params.id), req.user!.userId);
    res.json({ data: members, message: 'OK', error: null });
  } catch (err) { next(err); }
}

export async function addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userEmail = validateRequired(req.body.user_email, 'user_email');
    const roleName = validateRequired(req.body.role_name, 'role_name');
    const member = await projectService.addMember(p(req.params.id), req.user!.userId, userEmail, roleName);
    res.status(201).json({ data: member, message: 'Member added', error: null });
  } catch (err) { next(err); }
}

export async function updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roleName = validateRequired(req.body.role_name, 'role_name');
    const member = await projectService.updateMemberRole(
      p(req.params.id), req.user!.userId, p(req.params.uid), roleName
    );
    res.json({ data: member, message: 'Role updated', error: null });
  } catch (err) { next(err); }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await projectService.removeMember(p(req.params.id), req.user!.userId, p(req.params.uid));
    res.json({ data: null, message: 'Member removed', error: null });
  } catch (err) { next(err); }
}
