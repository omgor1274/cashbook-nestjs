import { Body, Controller, Get, Param, ParseEnumPipe, Post, Res, StreamableFile, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { Roles } from '../auth/decorators/role.decorators';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../user/user.enum';
import { DownloadReportDto } from './dto/download-report.dto';
import { ReportsService } from './reports.service';
import { ReportType } from './reports.enums';

@Controller('reports')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Get()
  getReportsCatalog() {
    return this.reportsService.getReportsCatalog();
  }

  @Roles(UserRole.ADMIN, UserRole.SUB_ADMIN, UserRole.SUPERVISOR)
  @Post(':reportType/download')
  async downloadReport(
    @Param('reportType', new ParseEnumPipe(ReportType)) reportType: ReportType,
    @Body() downloadReportDto: DownloadReportDto,
    @Res({ passthrough: true }) res,
  ) {
    const result = await this.reportsService.downloadReport(reportType, downloadReportDto);

    if ((result as any).buffer) {
      res.set({
        'Content-Type': (result as any).contentType,
        'Content-Disposition': `attachment; filename="${(result as any).fileName}"`,
        'Content-Length': (result as any).buffer.length,
      });
      return new StreamableFile((result as any).buffer);
    }

    if ((result as any).content) {
      res.set({
        'Content-Type': (result as any).contentType,
        'Content-Disposition': `attachment; filename="${(result as any).fileName}"`,
      });
      return (result as any).content;
    }

    return result;
  }
}
