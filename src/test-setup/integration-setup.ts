import 'jest-extended';

// Global test configuration for integration tests
declare global {
  namespace NodeJS {
    interface Global {
      integrationTestConfig: {
        apiUrl: string;
        timeout: number;
        testUser: {
          email: string;
          password: string;
          token?: string;
        };
        testData: {
          cleanupIds: string[];
          createdResources: Array<{
            type: string;
            id: string | number;
            endpoint: string;
          }>;
        };
      };
    }
  }
}

// Integration test configuration
global.integrationTestConfig = {
  apiUrl: process.env.TEST_API_URL || 'http://localhost:8000/api/v1',
  timeout: parseInt(process.env.TEST_TIMEOUT || '30000', 10),
  testUser: {
    email: process.env.INTEGRATION_TEST_USER || 'integration_test@example.com',
    password: process.env.INTEGRATION_TEST_PASSWORD || 'test_password_123',
  },
  testData: {
    cleanupIds: [],
    createdResources: [],
  },
};

// Setup Jest matchers
expect.extend({
  toBeValidApiResponse(received) {
    const pass = received && 
                 typeof received === 'object' && 
                 received.hasOwnProperty('id') ||
                 received.hasOwnProperty('count') ||
                 received.hasOwnProperty('results');
    
    if (pass) {
      return {
        message: () => `Expected ${JSON.stringify(received)} not to be a valid API response`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${JSON.stringify(received)} to be a valid API response`,
        pass: false,
      };
    }
  },

  toHaveValidPaginationStructure(received) {
    const pass = received &&
                 typeof received === 'object' &&
                 typeof received.count === 'number' &&
                 Array.isArray(received.results);
    
    if (pass) {
      return {
        message: () => `Expected ${JSON.stringify(received)} not to have valid pagination structure`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${JSON.stringify(received)} to have valid pagination structure (count, results)`,
        pass: false,
      };
    }
  },

  toMatchApiErrorFormat(received, expectedStatus?: number) {
    const isErrorFormat = received &&
                         typeof received === 'object' &&
                         (received.hasOwnProperty('detail') || 
                          received.hasOwnProperty('error') ||
                          received.hasOwnProperty('message'));
    
    const statusMatches = !expectedStatus || received.status === expectedStatus;
    
    const pass = isErrorFormat && statusMatches;
    
    if (pass) {
      return {
        message: () => `Expected ${JSON.stringify(received)} not to match API error format`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${JSON.stringify(received)} to match API error format${expectedStatus ? ` with status ${expectedStatus}` : ''}`,
        pass: false,
      };
    }
  }
});

// Custom Jest matchers type declarations
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidApiResponse(): R;
      toHaveValidPaginationStructure(): R;
      toMatchApiErrorFormat(expectedStatus?: number): R;
    }
  }
}

// Console configuration for tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out expected error logs during testing
  const message = args[0];
  if (typeof message === 'string') {
    if (message.includes('Warning: ') || 
        message.includes('Error: Network Error') ||
        message.includes('404') ||
        message.includes('401') ||
        message.includes('403')) {
      return; // Suppress expected errors
    }
  }
  originalConsoleError.apply(console, args);
};

// Test environment validation
beforeAll(async () => {
  const config = global.integrationTestConfig;
  
  // Validate required environment variables
  if (!config.apiUrl) {
    throw new Error('TEST_API_URL environment variable is required for integration tests');
  }
  
  if (!config.testUser.email || !config.testUser.password) {
    throw new Error('INTEGRATION_TEST_USER and INTEGRATION_TEST_PASSWORD are required');
  }
  
  // Validate backend connectivity
  try {
    const response = await fetch(`${config.apiUrl}/health/`, {
      method: 'GET',
      timeout: 5000,
    });
    
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Cannot connect to test backend at ${config.apiUrl}: ${error.message}`);
  }
});

// Cleanup after each test
afterEach(async () => {
  const config = global.integrationTestConfig;
  
  // Cleanup any resources created during the test
  for (const resource of config.testData.createdResources) {
    try {
      await fetch(`${config.apiUrl}${resource.endpoint}/${resource.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${config.testUser.token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.warn(`Failed to cleanup ${resource.type} ${resource.id}:`, error.message);
    }
  }
  
  // Reset for next test
  config.testData.createdResources = [];
});

// Global cleanup
afterAll(async () => {
  // Any final cleanup logic
  console.log('Integration tests completed');
});