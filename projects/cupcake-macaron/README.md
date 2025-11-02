# Cupcake Macaron

The `cupcake-macaron` library provides services and models for managing laboratory instruments, reagents, and storage locations within the Cupcake ecosystem.

## Key Features

- **Instrument Management:** Services for handling instrument inventory, maintenance, and metadata.
- **Reagent & Inventory Tracking:** Tools for managing reagent definitions and tracking stored reagent inventory.
- **Storage Hierarchy:** A flexible system for defining and organizing storage locations.
- **Chunked File Uploads:** Efficiently upload large annotation files (e.g., manuals, certificates) with progress tracking.

## Installation

To install the `@noatgnu/cupcake-macaron` library, run the following command:

```bash
npm install @noatgnu/cupcake-macaron
```

This library is an extension of `@noatgnu/cupcake-core` and depends on it. Make sure you have `@noatgnu/cupcake-core` installed and configured in your application.

## Services

### InstrumentService

The `InstrumentService` provides comprehensive methods for managing instruments:

- **CRUD Operations:** Create, read, update, and delete instruments.
- **Querying:** Filter and search for instruments based on various criteria.
- **Metadata:** Manage custom metadata associated with each instrument.
- **Annotations:** Upload and manage instrument-related documents (manuals, certificates, etc.) using a chunked upload mechanism.
- **Status Checks:** Check warranty and maintenance status.

**Usage:**

```typescript
import { InstrumentService } from '@noatgnu/cupcake-macaron';

@Component({ ... })
export class MyComponent {
  constructor(private instrumentService: InstrumentService) {
    this.instrumentService.getInstruments({ enabled: true }).subscribe(response => {
      // ...
    });
  }
}
```

### ReagentService

The `ReagentService` is used for managing both reagent definitions and specific instances of stored reagents:

- **Reagent & Stored Reagent CRUD:** Manage the lifecycle of reagents and their stored instances.
- **Inventory Management:** Query for stored reagents based on stock levels, expiration dates, and storage locations.
- **Metadata:** Attach custom metadata to stored reagents.
- **Annotations:** Upload and manage documents (e.g., MSDS) for stored reagents.

**Usage:**

```typescript
import { ReagentService } from '@noatgnu/cupcake-macaron';

@Component({ ... })
export class MyComponent {
  constructor(private reagentService: ReagentService) {
    // Get all expired reagents
    this.reagentService.getStoredReagents({ expired: true }).subscribe(response => {
      // ...
    });
  }
}
```

### StorageService

The `StorageService` allows you to define and organize the physical or virtual locations where items are stored:

- **CRUD Operations:** Create, read, update, and delete storage objects.
- **Hierarchical Structure:** Create nested storage locations to model complex storage systems (e.g., a freezer with shelves and racks).
- **Querying:** Find storage objects by type, location, or other properties.

**Usage:**

```typescript
import { StorageService } from '@noatgnu/cupcake-macaron';

@Component({ ... })
export class MyComponent {
  constructor(private storageService: StorageService) {
    // Get all root-level storage objects
    this.storageService.getRootStorageObjects().subscribe(response => {
      // ...
    });
  }
}
```

## Models

The `cupcake-macaron` library provides a rich set of models for type-safe interaction with the API. Key models include:

- `Instrument`
- `Reagent`
- `StoredReagent`
- `StorageObject`
- `InstrumentAnnotation`
- `StoredReagentAnnotation`

This library is an essential part of the Cupcake ecosystem, providing the tools needed to build sophisticated laboratory inventory and management applications.