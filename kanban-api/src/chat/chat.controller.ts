import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { FindOrCreateConversationDto } from './dto/find-or-create-conversation.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async listConversations(@CurrentUser() user: JwtPayload) {
    const conversations = await this.chatService.listConversations(user.userId);
    return { data: conversations, message: 'OK', error: null };
  }

  @Get('conversations/:id/messages')
  async listMessages(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const messages = await this.chatService.listMessages(id, user.userId);
    return { data: messages, message: 'OK', error: null };
  }

  @Delete('conversations/:id')
  async deleteConversation(@CurrentUser() user: JwtPayload, @Param('id', ParseIntPipe) id: number) {
    await this.chatService.deleteConversation(id, user.userId);
    return { data: null, message: 'Conversation deleted', error: null };
  }

  @Post('conversations')
  async findOrCreate(@CurrentUser() user: JwtPayload, @Body() dto: FindOrCreateConversationDto) {
    const conversationId = await this.chatService.findOrCreatePublic(user.userId, dto.recipient_user_id);
    return { data: { conversation_id: conversationId }, message: 'OK', error: null };
  }

  @Post('messages')
  async sendMessage(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.chatService.sendMessage({
      senderUserId: user.userId,
      content: dto.content,
      recipientUserId: dto.recipient_user_id,
      conversationId: dto.conversation_id,
    });

    return { data: message, message: 'Message sent', error: null };
  }
}
