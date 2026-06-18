import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardColumn } from '../entities';
import { RolePolicyService } from '../common/policies/role-policy.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';

@Injectable()
export class ColumnsService {
  constructor(
    @InjectRepository(BoardColumn)
    private readonly columnsRepo: Repository<BoardColumn>,
    private readonly rolePolicy: RolePolicyService,
    private readonly realtimeEvents: RealtimeEventsService,
  ) {}

  async listColumns(projectId: number, userId: number) {
    await this.rolePolicy.assertProjectReadable(projectId, userId);
    return this.columnsRepo.find({
      where: { project_id: projectId },
      order: { position: 'ASC', column_id: 'ASC' },
    });
  }

  async createColumn(projectId: number, userId: number, name: string, position?: number) {
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    let pos = position;
    if (pos === undefined) {
      const row = await this.columnsRepo
        .createQueryBuilder('c')
        .select('COALESCE(MAX(c.position), -1) + 1', 'next_pos')
        .where('c.project_id = :projectId', { projectId })
        .getRawOne<{ next_pos: string | number }>();
      pos = Number(row?.next_pos ?? 0);
    }

    const entity = this.columnsRepo.create({
      project_id: projectId,
      created_by_user_id: userId,
      name,
      position: pos,
    });
    const saved = await this.columnsRepo.save(entity);
    this.realtimeEvents.emitToProject(projectId, 'board.column.created', {
      project_id: projectId,
      column: saved,
    });
    return saved;
  }

  async updateColumn(
    projectId: number,
    columnId: number,
    userId: number,
    updates: { name?: string; position?: number },
  ) {
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    const existing = await this.columnsRepo.findOne({
      where: { column_id: columnId, project_id: projectId },
    });
    if (!existing) throw new NotFoundException('Column not found');

    const patch: Partial<BoardColumn> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.position !== undefined) patch.position = updates.position;
    if (Object.keys(patch).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    Object.assign(existing, patch);
    const saved = await this.columnsRepo.save(existing);

    this.realtimeEvents.emitToProject(projectId, 'board.column.updated', {
      project_id: projectId,
      column_id: columnId,
      column: saved,
    });
    return saved;
  }

  async deleteColumn(projectId: number, columnId: number, userId: number) {
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);
    const result = await this.columnsRepo.delete({
      column_id: columnId,
      project_id: projectId,
    });
    if (!result.affected) throw new NotFoundException('Column not found');
    this.realtimeEvents.emitToProject(projectId, 'board.column.deleted', {
      project_id: projectId,
      column_id: columnId,
    });
  }
}
