import fetch from 'node-fetch';

export default async function globalSetup() {
  console.log('Setting up integration test environment...');
  
  const apiUrl = process.env.TEST_API_URL || 'http://localhost:8000/api/v1';
  const testUser = {
    email: process.env.INTEGRATION_TEST_USER || 'integration_test@example.com',
    password: process.env.INTEGRATION_TEST_PASSWORD || 'test_password_123',
  };

  try {
    // Wait for backend to be ready
    console.log('Waiting for backend to be ready...');
    await waitForBackend(apiUrl);
    
    // Create or authenticate test user
    console.log('Setting up test user...');
    const authToken = await setupTestUser(apiUrl, testUser);
    
    // Store auth token for tests
    process.env.INTEGRATION_TEST_TOKEN = authToken;
    
    // Setup test data if needed
    await setupTestData(apiUrl, authToken);
    
    console.log('Integration test environment setup complete!');
    
  } catch (error) {
    console.error('Failed to setup integration test environment:', error.message);
    process.exit(1);
  }
}

async function waitForBackend(apiUrl: string, maxAttempts = 30): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${apiUrl}/health/`, {
        method: 'GET',
        timeout: 5000,
      });
      
      if (response.ok) {
        console.log(`Backend is ready after ${attempt} attempts`);
        return;
      }
    } catch (error) {
      // Backend not ready yet
    }
    
    if (attempt === maxAttempts) {
      throw new Error(`Backend not ready after ${maxAttempts} attempts`);
    }
    
    console.log(`Backend not ready, attempt ${attempt}/${maxAttempts}. Retrying in 2s...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

async function setupTestUser(apiUrl: string, testUser: { email: string; password: string }): Promise<string> {
  try {
    // Try to login first
    const loginResponse = await fetch(`${apiUrl}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: testUser.email,
        password: testUser.password,
      }),
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('Test user authenticated successfully');
      return loginData.access;
    }
    
    // If login failed, try to register the user
    console.log('Test user does not exist, attempting to register...');
    const registerResponse = await fetch(`${apiUrl}/users/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        username: testUser.email,
        password: testUser.password,
        first_name: 'Integration',
        last_name: 'Test',
      }),
    });
    
    if (registerResponse.ok) {
      console.log('Test user registered successfully');
      // Login after registration
      const loginAfterRegister = await fetch(`${apiUrl}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: testUser.email,
          password: testUser.password,
        }),
      });
      
      if (loginAfterRegister.ok) {
        const loginData = await loginAfterRegister.json();
        return loginData.access;
      }
    }
    
    throw new Error('Failed to setup test user');
    
  } catch (error) {
    throw new Error(`Test user setup failed: ${error.message}`);
  }
}

async function setupTestData(apiUrl: string, authToken: string): Promise<void> {
  try {
    console.log('Setting up test data...');
    
    // Create test lab group if it doesn't exist
    const labGroupResponse = await fetch(`${apiUrl}/lab-groups/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (labGroupResponse.ok) {
      const labGroups = await labGroupResponse.json();
      const testLabGroup = labGroups.results?.find((lg: any) => lg.name === 'Integration Test Lab');
      
      if (!testLabGroup) {
        console.log('Creating test lab group...');
        const createResponse = await fetch(`${apiUrl}/lab-groups/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Integration Test Lab',
            description: 'Lab group for integration testing',
          }),
        });
        
        if (createResponse.ok) {
          console.log('Test lab group created successfully');
        }
      } else {
        console.log('Test lab group already exists');
      }
    }
    
    // Setup other test data as needed
    console.log('Test data setup complete');
    
  } catch (error) {
    console.warn('Test data setup failed:', error.message);
    // Don't fail the entire setup for test data issues
  }
}