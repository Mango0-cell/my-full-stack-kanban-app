import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

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
