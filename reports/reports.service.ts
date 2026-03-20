import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model } from 'mongoose';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { Attendance, AttendanceDocument } from '../attendance/schemas/attendance.schema';
import { Transaction, TransactionDocument } from '../transaction/schemas/transaction.schema';
import {
  TransactionModuleType,
  TransactionPaymentType,
} from '../transaction/transaction.enums';
import { User, Userdocument } from '../user/schemas/user.schema';
import { DownloadReportDto } from './dto/download-report.dto';
import { ReportFormat, ReportTimePeriod, ReportType } from './reports.enums';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<AttendanceDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<Userdocument>,
  ) { }

  private normalizeStartOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private normalizeEndOfDay(value: Date): Date {
    const date = new Date(value);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  private resolveDateRange(
    timePeriod?: ReportTimePeriod,
    fromDate?: string,
    toDate?: string,
  ): { startDate: Date; endDate: Date } | null {
    const now = new Date();
    const period = timePeriod ?? (fromDate || toDate ? ReportTimePeriod.CUSTOM : undefined);

    if (!period) {
      return null;
    }

    if (period === ReportTimePeriod.CUSTOM) {
      if (!fromDate || !toDate) {
        throw new BadRequestException(
          'fromDate and toDate are required when timePeriod is custom',
        );
      }

      return {
        startDate: this.normalizeStartOfDay(new Date(fromDate)),
        endDate: this.normalizeEndOfDay(new Date(toDate)),
      };
    }

    if (period === ReportTimePeriod.TODAY) {
      return {
        startDate: this.normalizeStartOfDay(now),
        endDate: this.normalizeEndOfDay(now),
      };
    }

    if (period === ReportTimePeriod.LAST_7_DAYS) {
      const startDate = this.normalizeStartOfDay(now);
      startDate.setDate(startDate.getDate() - 6);
      return {
        startDate,
        endDate: this.normalizeEndOfDay(now),
      };
    }

    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: this.normalizeStartOfDay(startDate),
      endDate: this.normalizeEndOfDay(endDate),
    };
  }

  private formatDate(value: Date): string {
    return value.toISOString().split('T')[0];
  }

  private toCsv(rows: Array<Record<string, unknown>>): string {
    if (rows.length === 0) {
      return '';
    }

    const headers = Object.keys(rows[0]);
    const escape = (value: unknown): string => {
      const raw = value === null || value === undefined ? '' : String(value);
      const escaped = raw.replace(/"/g, '""');
      return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
    };

    const headerLine = headers.join(',');
    const dataLines = rows.map((row) => headers.map((key) => escape(row[key])).join(','));
    return [headerLine, ...dataLines].join('\n');
  }

  private generateExcel(rows: Array<Record<string, unknown>>): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private async generatePdf(rows: Array<Record<string, unknown>>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];
      doc.on('data', (buffer) => buffers.push(buffer));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      rows.forEach((row) => {
        doc.text(JSON.stringify(row));
        doc.moveDown();
      });
      doc.end();
    });
  }

  private async resolveSupervisorName(supervisorId?: string): Promise<string | null> {
    if (!supervisorId) {
      return null;
    }

    const supervisor = await this.userModel
      .findById(supervisorId)
      .select('fullname')
      .lean()
      .exec();
    return supervisor?.fullname ?? null;
  }

  getReportsCatalog() {
    return [
      {
        id: ReportType.EXPENSE,
        title: 'Expense Report',
        columns: ['Date', 'Supervisor', 'Location', 'Vendor', 'Amount', 'Payment Status', 'Items'],
      },
      {
        id: ReportType.FUND_TRANSFER,
        title: 'Fund Transfer Report',
        columns: ['Date', 'Supervisor', 'Location', 'Amount', 'Mode', 'Remark'],
      },
      {
        id: ReportType.SALARY,
        title: 'Salary Report',
        columns: ['Date', 'Worker Name', 'Amount', 'Paid By'],
      },
      {
        id: ReportType.ATTENDANCE,
        title: 'Attendance Report',
        columns: ['Date', 'Worker', 'ID', 'Project', 'Status'],
      },
      {
        id: ReportType.INVOICE,
        title: 'Invoice Report',
        columns: ['Invoice No', 'Client', 'SGST', 'CGST', 'Amount', 'Date'],
      },
      {
        id: ReportType.SITE_WISE,
        title: 'Site-Wise Report',
        columns: ['Site Name', 'Supervisor', 'Total Expense'],
      },
    ];
  }

  private buildTransactionFilter(
    downloadDto: DownloadReportDto,
    dateRange: { startDate: Date; endDate: Date } | null,
    baseFilter: QueryFilter<TransactionDocument>,
  ): QueryFilter<TransactionDocument> {
    const filter: QueryFilter<TransactionDocument> = { ...baseFilter };

    if (dateRange) {
      filter.transactionDate = { $gte: dateRange.startDate, $lte: dateRange.endDate };
    }

    if (downloadDto.location) {
      filter.location = downloadDto.location;
    }

    if (downloadDto.paymentStatus) {
      filter.paymentStatus = downloadDto.paymentStatus;
    }

    if (downloadDto.supervisorId) {
      filter.createdBy = downloadDto.supervisorId as any;
    }

    return filter;
  }

  private async buildExpenseReport(downloadDto: DownloadReportDto) {
    const dateRange = this.resolveDateRange(
      downloadDto.timePeriod,
      downloadDto.fromDate,
      downloadDto.toDate,
    );
    const filter = this.buildTransactionFilter(downloadDto, dateRange, {
      moduleType: TransactionModuleType.BILL,
    });

    const rows = await this.transactionModel
      .find(filter)
      .populate('createdBy', 'fullname')
      .sort({ transactionDate: -1 })
      .lean()
      .exec();

    return rows.map((row) => ({
      date: this.formatDate(row.transactionDate),
      supervisor: (row.createdBy as any)?.fullname ?? '',
      location: row.location ?? '',
      vendor: row.partyName,
      amount: row.amount,
      paymentStatus: row.paymentStatus,
      items: row.billDetails?.length ?? 0,
    }));
  }

  private async buildFundTransferReport(downloadDto: DownloadReportDto) {
    const dateRange = this.resolveDateRange(
      downloadDto.timePeriod,
      downloadDto.fromDate,
      downloadDto.toDate,
    );
    const filter = this.buildTransactionFilter(downloadDto, dateRange, {
      moduleType: TransactionModuleType.FUND,
    });

    const rows = await this.transactionModel
      .find(filter)
      .populate('createdBy', 'fullname')
      .sort({ transactionDate: -1 })
      .lean()
      .exec();

    return rows.map((row) => ({
      date: this.formatDate(row.transactionDate),
      supervisor: (row.createdBy as any)?.fullname ?? '',
      location: row.location ?? '',
      amount: row.amount,
      mode: row.paymentMethod,
      remark: row.note ?? '',
    }));
  }

  private async buildSalaryReport(downloadDto: DownloadReportDto) {
    const dateRange = this.resolveDateRange(
      downloadDto.timePeriod,
      downloadDto.fromDate,
      downloadDto.toDate,
    );
    const filter = this.buildTransactionFilter(downloadDto, dateRange, {
      paymentType: TransactionPaymentType.SALARY,
    });

    const rows = await this.transactionModel
      .find(filter)
      .populate('createdBy', 'fullname')
      .populate('assignedTo', 'fullname')
      .sort({ transactionDate: -1 })
      .lean()
      .exec();

    return rows.map((row) => ({
      date: this.formatDate(row.transactionDate),
      workerName: (row.assignedTo as any)?.fullname ?? row.partyName,
      amount: row.amount,
      paidBy: (row.createdBy as any)?.fullname ?? '',
    }));
  }

  private async buildAttendanceReport(downloadDto: DownloadReportDto) {
    const dateRange = this.resolveDateRange(
      downloadDto.timePeriod,
      downloadDto.fromDate,
      downloadDto.toDate,
    );

    const filter: QueryFilter<AttendanceDocument> = {};
    if (dateRange) {
      filter.attendanceDate = { $gte: dateRange.startDate, $lte: dateRange.endDate };
    }
    if (downloadDto.status) {
      filter.status = downloadDto.status as any;
    }
    if (downloadDto.location) {
      filter.location = downloadDto.location;
    }

    const rows = await this.attendanceModel
      .find(filter)
      .populate('workerId', 'fullname specialIndex')
      .sort({ attendanceDate: -1 })
      .lean()
      .exec();

    return rows.map((row) => ({
      date: this.formatDate(row.attendanceDate),
      worker: (row.workerId as any)?.fullname ?? '',
      id: (row.workerId as any)?.specialIndex ?? '',
      project: row.project ?? '',
      status: row.status,
    }));
  }

  private async buildInvoiceReport(downloadDto: DownloadReportDto) {
    const dateRange = this.resolveDateRange(
      downloadDto.timePeriod,
      downloadDto.fromDate,
      downloadDto.toDate,
    );
    const filter = this.buildTransactionFilter(downloadDto, dateRange, {
      moduleType: TransactionModuleType.BILL,
    });

    const rows = await this.transactionModel
      .find(filter)
      .sort({ transactionDate: -1 })
      .lean()
      .exec();

    return rows.map((row) => ({
      invoiceNo: row.referenceNumber || row._id.toString(),
      client: row.partyName,
      sgst: 0,
      cgst: 0,
      amount: row.amount,
      date: this.formatDate(row.transactionDate),
    }));
  }

  private async buildSiteWiseReport(downloadDto: DownloadReportDto) {
    const dateRange = this.resolveDateRange(
      downloadDto.timePeriod,
      downloadDto.fromDate,
      downloadDto.toDate,
    );
    const filter = this.buildTransactionFilter(downloadDto, dateRange, {});

    const rows = await this.transactionModel
      .aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              location: '$location',
              supervisorId: '$createdBy',
            },
            totalExpense: {
              $sum: {
                $cond: [{ $eq: ['$direction', 'debit'] }, '$amount', 0],
              },
            },
          },
        },
        { $sort: { '_id.location': 1 } },
      ])
      .exec();

    return Promise.all(
      rows.map(async (row) => ({
        siteName: row._id.location ?? '',
        supervisor: (await this.resolveSupervisorName(row._id.supervisorId?.toString())) ?? '',
        totalExpense: row.totalExpense ?? 0,
      })),
    );
  }

  async downloadReport(reportType: ReportType, downloadDto: DownloadReportDto) {
    const reportTypeHandlers: Record<
      ReportType,
      (payload: DownloadReportDto) => Promise<Array<Record<string, unknown>>>
    > = {
      [ReportType.EXPENSE]: (payload) => this.buildExpenseReport(payload),
      [ReportType.FUND_TRANSFER]: (payload) => this.buildFundTransferReport(payload),
      [ReportType.SALARY]: (payload) => this.buildSalaryReport(payload),
      [ReportType.ATTENDANCE]: (payload) => this.buildAttendanceReport(payload),
      [ReportType.INVOICE]: (payload) => this.buildInvoiceReport(payload),
      [ReportType.SITE_WISE]: (payload) => this.buildSiteWiseReport(payload),
    };

    const handler = reportTypeHandlers[reportType];
    if (!handler) {
      throw new BadRequestException('Unsupported report type');
    }

    const rows = await handler(downloadDto);
    const timestamp = Date.now();
    const extension = downloadDto.format === ReportFormat.EXCEL ? 'xlsx' : downloadDto.format;
    const fileName = `${reportType}-report-${timestamp}.${extension}`;

    if (downloadDto.format === ReportFormat.CSV) {
      return {
        reportType,
        format: downloadDto.format,
        fileName,
        rowCount: rows.length,
        contentType: 'text/csv',
        content: this.toCsv(rows),
      };
    }

    if (downloadDto.format === ReportFormat.EXCEL) {
      return {
        fileName,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: this.generateExcel(rows),
      };
    }

    if (downloadDto.format === ReportFormat.PDF) {
      return {
        fileName,
        contentType: 'application/pdf',
        buffer: await this.generatePdf(rows),
      };
    }

    throw new BadRequestException('Unsupported format');
  }
}
