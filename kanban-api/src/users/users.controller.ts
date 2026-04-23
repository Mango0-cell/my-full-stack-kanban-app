import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  NotFoundException,
  Query,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { FollowUserDto } from './dto/follow-user.dto';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: JwtPayload) {
    const profile = await this.usersService.getProfile(user.userId);
    if (!profile) throw new NotFoundException('User not found');
    return { data: profile, message: 'OK', error: null };
  }

  @Put('profile')
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    const profile = await this.usersService.updateProfile(user.userId, dto as Record<string, unknown>);
    return { data: profile, message: 'Profile updated', error: null };
  }

  @Put('password')
  async changePassword(@CurrentUser() user: JwtPayload, @Body() dto: ChangePasswordDto) {
    await this.usersService.changePassword(user.userId, dto.current_password, dto.new_password);
    return { data: null, message: 'Password changed successfully', error: null };
  }


  @Get('search')
  async searchUsers(@CurrentUser() user: JwtPayload, @Query() query: SearchUsersDto) {
    const users = await this.usersService.searchUsersByEmail(user.userId, query.email ?? '');
    return { data: users, message: 'OK', error: null };
  }

  @Post('follow')
  async followUser(@CurrentUser() user: JwtPayload, @Body() dto: FollowUserDto) {
    const follow = await this.usersService.followUser(user.userId, dto.followed_user_id, dto.label);
    return { data: follow, message: 'User followed', error: null };
  }

  @Delete('account')
  async deleteAccount(@CurrentUser() user: JwtPayload, @Body() dto: DeleteAccountDto) {
    await this.usersService.deleteAccount(user.userId, dto.password);
    return { data: null, message: 'Account deleted', error: null };
  }
}
