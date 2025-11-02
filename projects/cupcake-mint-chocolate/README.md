# Cupcake Mint Chocolate

The `cupcake-mint-chocolate` library provides a comprehensive suite of services and models for handling real-time messaging and user notifications within the Cupcake ecosystem.

## Key Features

- **Messaging System:** A complete messaging system with support for public and private threads, user participation, and message replies.
- **Notification Service:** A robust system for delivering notifications to users, with support for different types, priorities, and delivery statuses.
- **Real-time Communication:** WebSocket integration for real-time updates on new messages and notifications.

## Installation

To install the `@noatgnu/cupcake-mint-chocolate` library, run the following command:

```bash
npm install @noatgnu/cupcake-mint-chocolate
```

This library is an extension of `@noatgnu/cupcake-core` and depends on it. Make sure you have `@noatgnu/cupcake-core` installed and configured in your application.

## Services

### MessageThreadService

The `MessageThreadService` is responsible for managing message threads:

- **CRUD Operations:** Create, read, update, and delete message threads.
- **Participant Management:** Add, remove, and list participants in a thread.
- **Thread Actions:** Archive, unarchive, and mark threads as read.
- **Querying:** Filter and search for threads based on privacy, archive status, and creator.

**Usage:**

```typescript
import { MessageThreadService } from '@noatgnu/cupcake-mint-chocolate';

@Component({ ... })
export class MyComponent {
  constructor(private messageThreadService: MessageThreadService) {
    // Get all active public threads
    this.messageThreadService.getMessageThreads({ isPrivate: false, isArchived: false }).subscribe(response => {
      // ...
    });
  }
}
```

### MessageService

The `MessageService` handles the messages within threads:

- **CRUD Operations:** Create, read, update, and (soft) delete messages.
- **Querying:** Fetch messages by thread, sender, type, or content.
- **Replies:** Create messages that are replies to other messages.

**Usage:**

```typescript
import { MessageService } from '@noatgnu/cupcake-mint-chocolate';

@Component({ ... })
export class MyComponent {
  constructor(private messageService: MessageService) {
    const threadId = '...'; // ID of the message thread
    this.messageService.getThreadMessages(threadId).subscribe(response => {
      // ...
    });
  }
}
```

### NotificationService

The `NotificationService` manages user notifications:

- **CRUD Operations:** Create, read, update, and delete notifications.
- **Notification Management:** Mark notifications as read (individually or all at once).
- **Statistics:** Get statistics about a user's notifications (total, unread, etc.).
- **Querying:** Filter notifications by type, priority, sender, and delivery status.

**Usage:**

```typescript
import { NotificationService } from '@noatgnu/cupcake-mint-chocolate';

@Component({ ... })
export class MyComponent {
  constructor(private notificationService: NotificationService) {
    // Get all unread notifications
    this.notificationService.getUnreadNotifications().subscribe(response => {
      // ...
    });
  }
}
```

### Real-time Communication

This library also includes a WebSocket service (`CommunicationWebsocketService`) that provides real-time updates for new messages and notifications, ensuring that the user interface is always up-to-date without the need for polling.

## Models

The `cupcake-mint-chocolate` library provides a set of models for type-safe interaction with the messaging and notification APIs. Key models include:

- `MessageThread`
- `Message`
- `Notification`
- `ThreadParticipant`

This library is a crucial component for building interactive and engaging applications on the Cupcake platform.