import axios from 'axios';

/**
 * Debug validation errors
 */

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/v1`;

async function debugValidation() {
  console.log('🔍 Debugging validation errors...\n');
  
  try {
    // Test with a very simple client object
    console.log('Testing with minimal client data...');
    
    const response = await axios.post(`${API_URL}/clients`, {
      name: 'Test Client',
      email: 'test@client.com'
    }, {
      headers: {
        'Authorization': 'Bearer dummy_token_for_testing'
      }
    });
    
    console.log('Response:', response.data);
    
  } catch (error: any) {
    console.log('Error status:', error.response?.status);
    console.log('Error message:', error.response?.data?.message);
    console.log('Error details:', error.response?.data?.errors);
    console.log('Full error data:', JSON.stringify(error.response?.data, null, 2));
  }
}

debugValidation().catch(console.error);