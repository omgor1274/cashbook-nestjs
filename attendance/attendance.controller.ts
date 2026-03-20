import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/role.decorators';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../user/user.enum';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { QueryAttendanceDto, SearchAttendanceWorkersDto } from './dto/query-attendance.dto';

@Controller('attendance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Get('workers/search')
  searchWorkers(@Query() searchDto: SearchAttendanceWorkersDto) {
    return this.attendanceService.searchWorkers(searchDto);
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Post('mark')
  markAttendance(@Body() markAttendanceDto: MarkAttendanceDto, @Req() req: any) {
    return this.attendanceService.markAttendance(markAttendanceDto, req.user.id);
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Get()
  findAttendanceByDate(@Query() queryDto: QueryAttendanceDto) {
    return this.attendanceService.findAttendanceByDate(queryDto);
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Delete(':id')
  deleteAttendanceById(@Param('id') attendanceId: string) {
    return this.attendanceService.deleteAttendanceById(attendanceId);
  }
}
