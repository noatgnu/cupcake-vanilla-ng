export const environment = {
  production: false,
  apiUrl: 'https://localhost/api/v1',  // Use HTTPS via nginx proxy
  websocketUrl: 'wss://localhost/ws/notifications/',  // WebSocket URL with proper protocol
  features: {
    asyncTasks: true  // Enable async task processing
  }
};
