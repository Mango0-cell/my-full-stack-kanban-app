import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/attachment.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get('cards/:id/attachments')
  async list(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    const attachments = await this.attachmentsService.listAttachments(id, user.userId);
    return { data: attachments, message: 'OK', error: null };
  }

  @Post('cards/:id/attachments')
  async add(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAttachmentDto,
  ) {
    const attachment = await this.attachmentsService.addAttachment(id, user.userId, dto.file_url, dto.file_name);
    return { data: attachment, message: 'Attachment added', error: null };
  }

  @Delete('attachments/:id')
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    await this.attachmentsService.deleteAttachment(id, user.userId);
    return { data: null, message: 'Attachment deleted', error: null };
  }
}
