import { Controller, Get, Param, ParseIntPipe, Patch, Query } from '@nestjs/common';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { ListNotificationsDto } from './dto/list-notifications.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListNotificationsDto,
  ) {
    const notifications = await this.notificationsService.listNotifications(user.userId, query.limit ?? 5);
    return { data: notifications, message: 'OK', error: null };
  }

  @Patch(':id/read')
  async markRead(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const notification = await this.notificationsService.markAsRead(user.userId, id);
    return { data: notification, message: 'Notification marked as read', error: null };
  }
}
