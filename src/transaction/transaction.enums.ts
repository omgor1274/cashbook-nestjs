export enum TransactionModuleType {
  FUND = 'fund',
  BILL = 'bill',
}

export enum TransactionDirection {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export enum TransactionPaymentType {
  CASH = 'cash',
  UPI = 'upi',
  BANK_TRANSFER = 'bank_transfer',
  INTERNAL_TRANSFER = 'internal_transfer',
  PURCHASE = 'purchase',
  SALARY = 'salary',
  EXPENSE = 'expense',
  OTHER = 'other',
}

export enum TransactionPaymentMethod {
  CASH = 'cash',
  UPI = 'upi',
  BANK = 'bank',
  CARD = 'card',
  CHEQUE = 'cheque',
  NEFT = 'neft',
  RTGS = 'rtgs',
  IMPS = 'imps',
  OTHER = 'other',
}

export enum TransactionPaymentStatus {
  PAID = 'paid',
  LY_PAID = 'ly_paid',
  ADVANCE_PAID = 'advance_paid',
  GST_PAID = 'gst_paid',
  AMOUNT_PENDING = 'amount_pending',
}

export enum TransactionTimePeriod {
  TODAY = 'today',
  LAST_7_DAYS = 'last_7_days',
  THIS_MONTH = 'this_month',
  CUSTOM = 'custom',
}
