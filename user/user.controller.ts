import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/role.decorators';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GlobalUserSearchDto } from './dto/global-user-search.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './user.enum';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Get('global-search')
  globalSearch(@Query() queryDto: GlobalUserSearchDto) {
    return this.userService.globalSearchBySpecialIndex(queryDto.query, queryDto.limit);
  }

  @Roles(UserRole.ADMIN)
  @Post('normalize-special-index')
  normalizeSpecialIndexData() {
    return this.userService.normalizeSpecialIndexData();
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR, UserRole.WORKER, UserRole.VENDOR)
  @Get('me')
  getCurrentUserProfile(@Req() req: any) {
    return this.userService.getCurrentUserProfile(req.user.id);
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR, UserRole.WORKER, UserRole.VENDOR)
  @Get('me/menu')
  getCurrentUserMenu(@Req() req: any) {
    return this.userService.getCurrentUserMenu(req.user.id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  updateUserByAdmin(@Param('id') userId: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUserByAdmin(userId, updateUserDto);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  getUserByIdByAdmin(@Param('id') userId: string) {
    return this.userService.getUserByIdByAdmin(userId);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  deleteUserByAdmin(@Param('id') userId: string) {
    return this.userService.deleteUserByAdmin(userId);
  }
}
