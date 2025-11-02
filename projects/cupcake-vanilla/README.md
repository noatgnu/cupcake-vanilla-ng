# Cupcake Vanilla

The `cupcake-vanilla` library is a powerful toolkit for managing complex metadata, handling asynchronous operations, and working with SDRF (Sample and Data Relationship Format) data within the Cupcake ecosystem.

## Key Features

- **Advanced Metadata Management:** A comprehensive suite of services and components for creating, editing, and validating metadata tables.
- **Asynchronous Task Handling:** A robust system for managing long-running background tasks like data imports and exports.
- **Chunked File Uploads:** A reliable mechanism for uploading large files by splitting them into smaller chunks.
- **SDRF Support:** Specialized components and services for working with SDRF data.
- **Reusable UI Components:** A rich set of components for metadata editing, validation, and more.

## Installation

To install the `@noatgnu/cupcake-vanilla` library, run the following command:

```bash
npm install @noatgnu/cupcake-vanilla
```

This library is an extension of `@noatgnu/cupcake-core` and depends on it. Make sure you have `@noatgnu/cupcake-core` installed and configured in your application.

## Services

### MetadataTableService

The `MetadataTableService` is the cornerstone of the metadata management system:

- **CRUD Operations:** Full control over metadata tables and their columns.
- **Column Manipulation:** Add, remove, reorder, and combine columns.
- **Bulk Operations:** Perform bulk updates and deletions on columns.
- **Validation:** Validate changes to sample counts and other metadata.

**Usage:**

```typescript
import { MetadataTableService } from '@noatgnu/cupcake-vanilla';

@Component({ ... })
export class MyComponent {
  constructor(private metadataTableService: MetadataTableService) {
    // Get all published metadata tables
    this.metadataTableService.getMetadataTables({ isPublished: true }).subscribe(response => {
      // ...
    });
  }
}
```

### AsyncTaskService

The `AsyncTaskService` is used to manage long-running background tasks:

- **Task Monitoring:** Get the status of any asynchronous task.
- **Task Control:** Cancel queued or running tasks.
- **Result Retrieval:** Download the results of completed tasks.

**Usage:**

```typescript
import { AsyncTaskService } from '@noatgnu/cupcake-vanilla';

@Component({ ... })
export class MyComponent {
  constructor(private asyncTaskService: AsyncTaskService) {
    const taskId = '...'; // ID of the async task
    this.asyncTaskService.getAsyncTask(taskId).subscribe(status => {
      // ...
    });
  }
}
```

### ChunkedUploadService

The `ChunkedUploadService` provides a reliable way to upload large files:

- **Chunking:** Automatically splits large files into smaller, manageable chunks.
- **Progress Tracking:** Provides progress updates during the upload process.
- **Resumability (server-dependent):** Can be used to build resumable upload functionality.

**Usage:**

```typescript
import { ChunkedUploadService } from '@noatgnu/cupcake-vanilla';

@Component({ ... })
export class MyComponent {
  constructor(private chunkedUploadService: ChunkedUploadService) { }

  uploadFile(file: File) {
    this.chunkedUploadService.uploadFileInChunks(file).subscribe(response => {
      // ...
    });
  }
}
```

## Components

The `cupcake-vanilla` library includes a wide array of UI components to facilitate metadata management and data validation, including:

- **Metadata Table Editor:** A full-featured editor for metadata tables.
- **Validation Modals:** Modals for displaying validation results and resolving errors.
- **SDRF Input Components:** Specialized input fields for SDRF data types (e.g., age, modifications).
- **Excel Export/Import:** Modals for exporting and importing data from Excel files.

## Models

The library provides a comprehensive set of models for working with metadata, async tasks, and SDRF data. Key models include:

- `MetadataTable`
- `MetadataColumn`
- `AsyncTaskStatus`
- `ChunkedUploadStatus`

With its powerful services and rich component library, `cupcake-vanilla` is an essential tool for building sophisticated data management and analysis applications on the Cupcake platform.