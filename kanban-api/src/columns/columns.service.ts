import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RolePolicyService } from '../common/policies/role-policy.service';
import { RealtimeEventsService } from '../realtime/realtime-events.service';

@Injectable()
export class ColumnsService {
  constructor(
    private db: DatabaseService,
    private readonly rolePolicy: RolePolicyService,
    private readonly realtimeEvents: RealtimeEventsService,
  ) {}

  async listColumns(projectId: number, userId: number) {
    await this.rolePolicy.assertProjectReadable(projectId, userId);
    const { rows } = await this.db.query(
      'SELECT * FROM columns WHERE project_id = $1 ORDER BY position, column_id',
      [projectId],
    );
    return rows;
  }

  async createColumn(projectId: number, userId: number, name: string, position?: number) {
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    let pos = position;
    if (pos === undefined) {
      const { rows } = await this.db.query(
        'SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM columns WHERE project_id = $1',
        [projectId],
      );
      pos = rows[0].next_pos;
    }

    const { rows } = await this.db.query(
      `INSERT INTO columns (project_id, created_by_user_id, name, position)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [projectId, userId, name, pos],
    );
    this.realtimeEvents.emitToProject(projectId, 'board.column.created', {
      project_id: projectId,
      column: rows[0],
    });
    return rows[0];
  }

  async updateColumn(projectId: number, columnId: number, userId: number, updates: { name?: string; position?: number }) {
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);

    const { rows: existing } = await this.db.query(
      'SELECT * FROM columns WHERE column_id = $1 AND project_id = $2',
      [columnId, projectId],
    );
    if (existing.length === 0) throw new NotFoundException('Column not found');

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.name !== undefined) { fields.push(`name = $${idx}`); values.push(updates.name); idx++; }
    if (updates.position !== undefined) { fields.push(`position = $${idx}`); values.push(updates.position); idx++; }
    if (fields.length === 0) throw new BadRequestException('No fields to update');

    fields.push(`updated_at = NOW()`);
    values.push(columnId);

    const { rows } = await this.db.query(
      `UPDATE columns SET ${fields.join(', ')} WHERE column_id = $${idx} RETURNING *`,
      values,
    );
    this.realtimeEvents.emitToProject(projectId, 'board.column.updated', {
      project_id: projectId,
      column_id: columnId,
      column: rows[0],
    });
    return rows[0];
  }

  async deleteColumn(projectId: number, columnId: number, userId: number) {
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);
    const { rows } = await this.db.query(
      'DELETE FROM columns WHERE column_id = $1 AND project_id = $2 RETURNING column_id',
      [columnId, projectId],
    );
    if (rows.length === 0) throw new NotFoundException('Column not found');
    this.realtimeEvents.emitToProject(projectId, 'board.column.deleted', {
      project_id: projectId,
      column_id: columnId,
    });
  }
}
