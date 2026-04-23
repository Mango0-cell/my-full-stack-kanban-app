import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller()
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('cards/:id/activity')
  async get(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    const activity = await this.activityService.getCardActivity(id, user.userId);
    return { data: activity, message: 'OK', error: null };
  }
}
