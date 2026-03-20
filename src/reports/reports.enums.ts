export enum ReportType {
  EXPENSE = 'expense',
  FUND_TRANSFER = 'fund_transfer',
  SALARY = 'salary',
  ATTENDANCE = 'attendance',
  INVOICE = 'invoice',
  SITE_WISE = 'site_wise',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
}

export enum ReportTimePeriod {
  TODAY = 'today',
  LAST_7_DAYS = 'last_7_days',
  THIS_MONTH = 'this_month',
  CUSTOM = 'custom',
}
