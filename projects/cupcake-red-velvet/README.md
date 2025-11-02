# Cupcake Red Velvet

The `cupcake-red-velvet` library provides services and models for managing scientific projects, protocols, and experimental sessions within the Cupcake ecosystem.

## Key Features

- **Project Management:** Organize your work into projects, with support for ownership, lab groups, and visibility controls.
- **Protocol Authoring & Execution:** Create, manage, and execute detailed, step-by-step protocols.
- **Session Tracking:** Track the execution of protocols in experimental sessions, including their status and timing.
- **Real-time Updates:** WebSocket integration for real-time monitoring of session progress and timers.

## Installation

To install the `@noatgnu/cupcake-red-velvet` library, run the following command:

```bash
npm install @noatgnu/cupcake-red-velvet
```

This library is an extension of `@noatgnu/cupcake-core` and depends on it. Make sure you have `@noatgnu/cupcake-core` installed and configured in your application.

## Services

### ProjectService

The `ProjectService` is used to manage projects:

- **CRUD Operations:** Create, read, update, and delete projects.
- **Querying:** Find projects by owner, lab group, visibility (public/private), and more.
- **Session Management:** Retrieve all sessions associated with a specific project.

**Usage:**

```typescript
import { ProjectService } from '@noatgnu/cupcake-red-velvet';

@Component({ ... })
export class MyComponent {
  constructor(private projectService: ProjectService) {
    // Get all projects owned by the current user
    this.projectService.getMyProjects().subscribe(projects => {
      // ...
    });
  }
}
```

### ProtocolService

The `ProtocolService` handles the creation and management of protocols:

- **CRUD Operations:** Create, read, update, and delete protocols.
- **Protocol Structure:** Manage the sections and steps that make up a protocol.
- **Ratings:** Allow users to rate and review protocols.
- **Querying:** Search and filter protocols by category, creator, and other attributes.

**Usage:**

```typescript
import { ProtocolService } from '@noatgnu/cupcake-red-velvet';

@Component({ ... })
export class MyComponent {
  constructor(private protocolService: ProtocolService) {
    // Get all public protocol templates
    this.protocolService.getProtocols({ isPublic: true, isTemplate: true }).subscribe(response => {
      // ...
    });
  }
}
```

### SessionService

The `SessionService` is used to track the execution of protocols in sessions:

- **CRUD Operations:** Create, read, update, and delete sessions.
- **Session Lifecycle:** Start and end sessions to track their duration.
- **Querying:** Filter sessions by project, user, status, and date range.
- **Annotations:** Manage session-related documents and notes.

**Usage:**

```typescript
import { SessionService } from '@noatgnu/cupcake-red-velvet';

@Component({ ... })
export class MyComponent {
  constructor(private sessionService: SessionService) {
    const projectId = 123;
    this.sessionService.getSessionsByProject(projectId).subscribe(response => {
      // ...
    });
  }
}
```

### Real-time Functionality

This library includes WebSocket services (`TimekeeperWebsocketService` and `NotificationWebsocketService`) to provide real-time updates on session timers and other events, enabling a dynamic and interactive user experience.

## Models

The `cupcake-red-velvet` library provides a rich set of models for working with projects, protocols, and sessions. Key models include:

- `Project`
- `ProtocolModel`
- `Session`
- `ProtocolSection`
- `ProtocolStep`
- `Timekeeper`

This library is essential for building applications that involve structured experimental workflows and data collection on the Cupcake platform.