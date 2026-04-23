import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('cards/:id/comments')
  async list(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    const comments = await this.commentsService.listComments(id, user.userId);
    return { data: comments, message: 'OK', error: null };
  }

  @Post('cards/:id/comments')
  async add(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCommentDto,
  ) {
    const comment = await this.commentsService.addComment(id, user.userId, dto.content);
    return { data: comment, message: 'Comment added', error: null };
  }

  @Put('comments/:id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCommentDto,
  ) {
    const comment = await this.commentsService.updateComment(id, user.userId, dto.content);
    return { data: comment, message: 'Comment updated', error: null };
  }

  @Delete('comments/:id')
  async delete(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    await this.commentsService.deleteComment(id, user.userId);
    return { data: null, message: 'Comment deleted', error: null };
  }
}
