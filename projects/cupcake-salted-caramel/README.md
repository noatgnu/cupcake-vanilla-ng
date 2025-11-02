# Cupcake Salted Caramel

The `cupcake-salted-caramel` library provides services and models for handling billing, service tiers, and pricing within the Cupcake ecosystem.

## Key Features

- **Billing Management:** A comprehensive system for creating, tracking, and managing billing records.
- **Service Tiers:** Define different tiers of service with their own pricing rules and modifiers.
- **Flexible Pricing:** Manage prices for different services and billable items.

## Installation

To install the `@noatgnu/cupcake-salted-caramel` library, run the following command:

```bash
npm install @noatgnu/cupcake-salted-caramel
```

This library is an extension of `@noatgnu/cupcake-core` and depends on it. Make sure you have `@noatgnu/cupcake-core` installed and configured in your application.

## Services

### BillingRecordService

The `BillingRecordService` is the core of the billing system, responsible for managing billing records:

- **CRUD Operations:** Create, read, update, and delete billing records.
- **Status Tracking:** Track the status of billing records (e.g., pending, approved, paid, disputed).
- **Approval Workflow:** Approve billing records before they are processed.
- **Querying & Reporting:** Get billing summaries and filter records by status, user, cost center, and date range.

**Usage:**

```typescript
import { BillingRecordService } from '@noatgnu/cupcake-salted-caramel';

@Component({ ... })
export class MyComponent {
  constructor(private billingRecordService: BillingRecordService) {
    // Get all billing records pending approval
    this.billingRecordService.getPendingApproval().subscribe(response => {
      // ...
    });
  }
}
```

### ServiceTierService

The `ServiceTierService` handles the management of service tiers:

- **CRUD Operations:** Create, read, update, and delete service tiers.
- **Price Calculation:** Calculate prices based on a service tier's modifiers (e.g., multipliers, discounts).
- **Querying:** Find service tiers by priority, active status, and other attributes.

**Usage:**

```typescript
import { ServiceTierService } from '@noatgnu/cupcake-salted-caramel';

@Component({ ... })
export class MyComponent {
  constructor(private serviceTierService: ServiceTierService) {
    // Get all active service tiers
    this.serviceTierService.getActiveTiers().subscribe(tiers => {
      // ...
    });
  }
}
```

### Other Services

This library also includes the following services:

- **`ServicePriceService`:** For managing the prices of different services.
- **`BillableItemTypeService`:** For defining the types of items that can be billed.

## Models

The `cupcake-salted-caramel` library provides a set of models for working with billing and service data. Key models include:

- `BillingRecord`
- `ServiceTier`
- `ServicePrice`
- `BillableItemType`

This library is essential for any Cupcake application that needs to implement a billing or service-based pricing system.