import fetch from 'node-fetch';

export default async function globalTeardown() {
  console.log('Cleaning up integration test environment...');
  
  const apiUrl = process.env.TEST_API_URL || 'http://localhost:8000/api/v1';
  const authToken = process.env.INTEGRATION_TEST_TOKEN;
  
  if (!authToken) {
    console.log('No auth token found, skipping cleanup');
    return;
  }
  
  try {
    // Cleanup test data
    await cleanupTestData(apiUrl, authToken);
    console.log('Integration test cleanup complete!');
    
  } catch (error) {
    console.warn('Integration test cleanup failed:', error.message);
    // Don't fail CI for cleanup issues
  }
}

async function cleanupTestData(apiUrl: string, authToken: string): Promise<void> {
  try {
    console.log('Cleaning up test data...');
    
    // Get all resources created by the integration test user
    const endpoints = [
      'metadata-tables',
      'sample-pools', 
      'metadata-columns',
      'lab-groups',
      'async-tasks'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${apiUrl}/${endpoint}/`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const resources = data.results || [];
          
          // Filter for test resources (those with "test" or "integration" in the name)
          const testResources = resources.filter((resource: any) => 
            resource.name?.toLowerCase().includes('test') ||
            resource.name?.toLowerCase().includes('integration') ||
            resource.description?.toLowerCase().includes('test')
          );
          
          // Delete test resources
          for (const resource of testResources) {
            try {
              await fetch(`${apiUrl}/${endpoint}/${resource.id}/`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json',
                },
              });
              console.log(`Deleted ${endpoint} ${resource.id}: ${resource.name}`);
            } catch (deleteError) {
              console.warn(`Failed to delete ${endpoint} ${resource.id}:`, deleteError.message);
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to cleanup ${endpoint}:`, error.message);
      }
    }
    
    // Cleanup any uploaded files
    await cleanupTestFiles(apiUrl, authToken);
    
    console.log('Test data cleanup complete');
    
  } catch (error) {
    throw new Error(`Test data cleanup failed: ${error.message}`);
  }
}

async function cleanupTestFiles(apiUrl: string, authToken: string): Promise<void> {
  try {
    // Cleanup chunked upload sessions
    const uploadsResponse = await fetch(`${apiUrl}/chunked-upload/`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (uploadsResponse.ok) {
      const uploads = await uploadsResponse.json();
      const testUploads = uploads.results?.filter((upload: any) => 
        upload.filename?.includes('test') || upload.filename?.includes('integration')
      ) || [];
      
      for (const upload of testUploads) {
        try {
          await fetch(`${apiUrl}/chunked-upload/${upload.id}/`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          });
          console.log(`Deleted upload session ${upload.id}: ${upload.filename}`);
        } catch (error) {
          console.warn(`Failed to delete upload ${upload.id}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.warn('Test file cleanup failed:', error.message);
  }
}