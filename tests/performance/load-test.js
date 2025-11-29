const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

// Test configuration
const CONCURRENT_USERS = 10;
const REQUESTS_PER_USER = 10;
const ENDPOINTS = [
  { method: 'GET', path: '/api/drugs', name: 'Get Drugs' },
  { method: 'GET', path: '/api/supply-chains', name: 'Get Supply Chains' },
  { method: 'GET', path: '/api/digital-signatures', name: 'Get Digital Signatures' }
];

// Helper function to make request
async function makeRequest(method, path, token = null) {
  const startTime = Date.now();
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${path}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    };
    
    const response = await axios(config);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      success: true,
      status: response.status,
      duration,
      dataSize: JSON.stringify(response.data).length
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      success: false,
      status: error.response?.status || 0,
      duration,
      error: error.message
    };
  }
}

// Simulate concurrent users
async function simulateUser(userId, requestsPerUser) {
  const results = [];
  
  for (let i = 0; i < requestsPerUser; i++) {
    const endpoint = ENDPOINTS[i % ENDPOINTS.length];
    const result = await makeRequest(endpoint.method, endpoint.path);
    results.push({
      userId,
      requestId: i + 1,
      endpoint: endpoint.name,
      ...result
    });
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// Main load test function
async function runLoadTest() {
  console.log('🚀 Starting Load Test...');
  console.log(`📊 Configuration:`);
  console.log(`   - Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`   - Requests per User: ${REQUESTS_PER_USER}`);
  console.log(`   - Total Requests: ${CONCURRENT_USERS * REQUESTS_PER_USER}`);
  console.log(`   - API Base URL: ${API_BASE_URL}\n`);

  const startTime = Date.now();
  const allResults = [];

  // Run concurrent users
  const userPromises = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    userPromises.push(simulateUser(i + 1, REQUESTS_PER_USER));
  }

  const userResults = await Promise.all(userPromises);
  userResults.forEach(results => {
    allResults.push(...results);
  });

  const endTime = Date.now();
  const totalDuration = endTime - startTime;

  // Calculate statistics
  const successfulRequests = allResults.filter(r => r.success);
  const failedRequests = allResults.filter(r => !r.success);
  const durations = successfulRequests.map(r => r.duration);
  
  const stats = {
    totalRequests: allResults.length,
    successfulRequests: successfulRequests.length,
    failedRequests: failedRequests.length,
    successRate: (successfulRequests.length / allResults.length) * 100,
    totalDuration,
    averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
    minResponseTime: Math.min(...durations),
    maxResponseTime: Math.max(...durations),
    requestsPerSecond: (allResults.length / (totalDuration / 1000)).toFixed(2)
  };

  // Print results
  console.log('\n📈 Load Test Results:');
  console.log('==========================================');
  console.log(`Total Requests: ${stats.totalRequests}`);
  console.log(`Successful: ${stats.successfulRequests} (${stats.successRate.toFixed(2)}%)`);
  console.log(`Failed: ${stats.failedRequests}`);
  console.log(`Total Duration: ${(stats.totalDuration / 1000).toFixed(2)}s`);
  console.log(`Requests per Second: ${stats.requestsPerSecond}`);
  console.log(`\nResponse Time Statistics:`);
  console.log(`  Average: ${stats.averageResponseTime.toFixed(2)}ms`);
  console.log(`  Min: ${stats.minResponseTime}ms`);
  console.log(`  Max: ${stats.maxResponseTime}ms`);

  // Performance thresholds
  const p95Index = Math.floor(durations.length * 0.95);
  const p95ResponseTime = durations.sort((a, b) => a - b)[p95Index];
  console.log(`  P95: ${p95ResponseTime}ms`);

  console.log('\n✅ Load Test Completed!');

  // Check if performance meets requirements
  const targetResponseTime = 200; // ms
  if (stats.averageResponseTime > targetResponseTime) {
    console.log(`\n⚠️  Warning: Average response time (${stats.averageResponseTime.toFixed(2)}ms) exceeds target (${targetResponseTime}ms)`);
  } else {
    console.log(`\n✅ Average response time meets target (< ${targetResponseTime}ms)`);
  }

  return stats;
}

// Run if executed directly
if (require.main === module) {
  runLoadTest()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Load test failed:', error);
      process.exit(1);
    });
}

module.exports = { runLoadTest, makeRequest };

