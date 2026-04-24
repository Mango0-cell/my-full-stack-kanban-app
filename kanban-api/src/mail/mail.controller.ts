import { Body, Controller, HttpCode, HttpStatus, Inject, Post, forwardRef } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendInviteDto } from './dto/send-invite.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@Controller('invite')
export class MailController {
  constructor(
    private readonly mail: MailService,
    @Inject(forwardRef(() => UsersService))
    private readonly users: UsersService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async sendInvite(
    @Body() dto: SendInviteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const profile = await this.users.getProfile(user.userId);
    const inviterName = profile?.display_name ?? user.email;

    await this.mail.sendInvite({
      to: dto.email,
      inviterName,
      message: dto.message,
    });

    return {
      data: null,
      message: `Invitation sent to ${dto.email}`,
      error: null,
    };
  }
}
