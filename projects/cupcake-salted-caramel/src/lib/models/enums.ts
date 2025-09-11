export enum BillingUnit {
  HOURLY = 'hourly',
  DAILY = 'daily',
  USAGE = 'usage',
  SAMPLE = 'sample',
  FLAT = 'flat',
  CUSTOM = 'custom'
}

export enum BillingStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  BILLED = 'billed',
  PAID = 'paid',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled'
}