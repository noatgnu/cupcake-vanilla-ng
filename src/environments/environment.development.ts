export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',
  websocketUrl: 'ws://localhost:8000/ws/notifications/',  // WebSocket URL matching development API
  features: {
    asyncTasks: true  // Enable async task processing
  }
};