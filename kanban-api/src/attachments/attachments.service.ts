import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from '../entities';
import { RolePolicyService } from '../common/policies/role-policy.service';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepo: Repository<Attachment>,
    private readonly rolePolicy: RolePolicyService,
  ) {}

  private async getAttachmentProject(attachmentId: number): Promise<number> {
    const row = await this.attachmentsRepo
      .createQueryBuilder('a')
      .innerJoin('a.card', 'c')
      .innerJoin('c.column', 'col')
      .where('a.attachment_id = :id', { id: attachmentId })
      .select('col.project_id', 'project_id')
      .getRawOne<{ project_id: number }>();
    if (!row) throw new NotFoundException('Attachment not found');
    return row.project_id;
  }

  async listAttachments(cardId: number, userId: number) {
    const projectId = await this.rolePolicy.getCardProjectId(cardId);
    await this.rolePolicy.assertProjectReadable(projectId, userId);
    return this.attachmentsRepo
      .createQueryBuilder('a')
      .leftJoin('a.uploaded_by', 'u')
      .where('a.card_id = :cardId', { cardId })
      .orderBy('a.created_at', 'ASC')
      .select([
        'a.attachment_id AS attachment_id',
        'a.card_id AS card_id',
        'a.uploaded_by_user_id AS uploaded_by_user_id',
        'a.file_url AS file_url',
        'a.file_name AS file_name',
        'a.created_at AS created_at',
        'u.display_name AS uploader_name',
      ])
      .getRawMany();
  }

  async addAttachment(cardId: number, userId: number, fileUrl: string, fileName: string) {
    const projectId = await this.rolePolicy.getCardProjectId(cardId);
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);
    const entity = this.attachmentsRepo.create({
      card_id: cardId,
      uploaded_by_user_id: userId,
      file_url: fileUrl,
      file_name: fileName,
    });
    return this.attachmentsRepo.save(entity);
  }

  async deleteAttachment(attachmentId: number, userId: number) {
    const projectId = await this.getAttachmentProject(attachmentId);
    await this.rolePolicy.assertProjectBoardWrite(projectId, userId);
    await this.attachmentsRepo.delete(attachmentId);
  }
}
