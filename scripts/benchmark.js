/**
 * Benchmark Script
 * Đo hiệu năng API trước và sau khi tối ưu
 * 
 * Sử dụng: node scripts/benchmark.js
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Cấu hình
const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const AUTH_TOKEN = process.env.AUTH_TOKEN || ''; // Cần token để test các API protected

// Test scenarios
const scenarios = [
  {
    name: 'GET /api/health',
    method: 'GET',
    url: `${BASE_URL}/api/health`,
    auth: false,
    iterations: 100
  },
  {
    name: 'GET /api/blockchain/stats',
    method: 'GET',
    url: `${BASE_URL}/api/blockchain/stats`,
    auth: true,
    iterations: 50
  },
  {
    name: 'GET /api/digital-signatures/stats',
    method: 'GET',
    url: `${BASE_URL}/api/digital-signatures/stats`,
    auth: true,
    iterations: 50
  },
  {
    name: 'GET /api/digital-signatures/templates',
    method: 'GET',
    url: `${BASE_URL}/api/digital-signatures/templates`,
    auth: true,
    iterations: 50
  },
  {
    name: 'GET /api/digital-signatures/ca/providers',
    method: 'GET',
    url: `${BASE_URL}/api/digital-signatures/ca/providers`,
    auth: true,
    iterations: 50
  },
  {
    name: 'GET /api/blockchain/drugs',
    method: 'GET',
    url: `${BASE_URL}/api/blockchain/drugs`,
    auth: true,
    iterations: 30
  }
];

// Kết quả benchmark
const results = [];

/**
 * Chạy một test scenario
 */
async function runScenario(scenario) {
  console.log(`\n📊 Đang chạy: ${scenario.name}`);
  console.log(`   URL: ${scenario.url}`);
  console.log(`   Số lần lặp: ${scenario.iterations}`);

  const latencies = [];
  const errors = [];
  let successCount = 0;

  const headers = {};
  if (scenario.auth && AUTH_TOKEN) {
    headers.Authorization = `Bearer ${AUTH_TOKEN}`;
  }

  for (let i = 0; i < scenario.iterations; i++) {
    const startTime = performance.now();
    
    try {
      const response = await axios({
        method: scenario.method,
        url: scenario.url,
        headers,
        timeout: 10000
      });

      const endTime = performance.now();
      const latency = endTime - startTime;
      latencies.push(latency);

      if (response.status === 200 || response.status === 201) {
        successCount++;
      }

      // Kiểm tra cache header
      const cacheStatus = response.headers['x-cache'] || 'N/A';
      if (i === 0) {
        console.log(`   Cache status (lần 1): ${cacheStatus}`);
      }
    } catch (error) {
      const endTime = performance.now();
      const latency = endTime - startTime;
      latencies.push(latency);
      errors.push({
        iteration: i + 1,
        error: error.message,
        status: error.response?.status
      });
    }

    // Progress indicator
    if ((i + 1) % 10 === 0) {
      process.stdout.write(`   Đã chạy: ${i + 1}/${scenario.iterations}\r`);
    }
  }

  // Tính toán thống kê
  latencies.sort((a, b) => a - b);
  const min = latencies[0] || 0;
  const max = latencies[latencies.length - 1] || 0;
  const avg = latencies.reduce((sum, val) => sum + val, 0) / latencies.length;
  const median = latencies[Math.floor(latencies.length / 2)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

  const result = {
    name: scenario.name,
    url: scenario.url,
    iterations: scenario.iterations,
    success: successCount,
    errors: errors.length,
    latency: {
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      avg: Math.round(avg * 100) / 100,
      median: Math.round(median * 100) / 100,
      p95: Math.round(p95 * 100) / 100,
      p99: Math.round(p99 * 100) / 100
    },
    throughput: Math.round((successCount / (latencies.reduce((sum, val) => sum + val, 0) / 1000)) * 100) / 100 // requests per second
  };

  results.push(result);

  // In kết quả
  console.log(`\n   ✅ Thành công: ${successCount}/${scenario.iterations}`);
  console.log(`   ❌ Lỗi: ${errors.length}`);
  console.log(`   ⏱️  Latency (ms):`);
  console.log(`      Min: ${result.latency.min}ms`);
  console.log(`      Max: ${result.latency.max}ms`);
  console.log(`      Avg: ${result.latency.avg}ms`);
  console.log(`      Median: ${result.latency.median}ms`);
  console.log(`      P95: ${result.latency.p95}ms`);
  console.log(`      P99: ${result.latency.p99}ms`);
  console.log(`   📈 Throughput: ${result.throughput} req/s`);

  if (errors.length > 0 && errors.length <= 5) {
    console.log(`   ⚠️  Lỗi chi tiết:`);
    errors.forEach(err => {
      console.log(`      Lần ${err.iteration}: ${err.error} (${err.status || 'N/A'})`);
    });
  }
}

/**
 * In báo cáo tổng hợp
 */
function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 BÁO CÁO TỔNG HỢP BENCHMARK');
  console.log('='.repeat(80));

  console.log('\n📋 Tóm tắt theo scenario:');
  console.log('-'.repeat(80));
  console.log(
    'Scenario'.padEnd(40) +
    'Success'.padEnd(10) +
    'Avg Latency'.padEnd(15) +
    'P95 Latency'.padEnd(15) +
    'Throughput'
  );
  console.log('-'.repeat(80));

  results.forEach(result => {
    console.log(
      result.name.padEnd(40) +
      `${result.success}/${result.iterations}`.padEnd(10) +
      `${result.latency.avg}ms`.padEnd(15) +
      `${result.latency.p95}ms`.padEnd(15) +
      `${result.throughput} req/s`
    );
  });

  // Tính tổng hợp
  const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
  const totalIterations = results.reduce((sum, r) => sum + r.iterations, 0);
  const avgLatency = results.reduce((sum, r) => sum + r.latency.avg, 0) / results.length;
  const avgThroughput = results.reduce((sum, r) => sum + r.throughput, 0) / results.length;

  console.log('-'.repeat(80));
  console.log('\n📈 Tổng hợp:');
  console.log(`   Tổng số requests: ${totalIterations}`);
  console.log(`   Tổng số thành công: ${totalSuccess} (${Math.round((totalSuccess / totalIterations) * 100)}%)`);
  console.log(`   Latency trung bình: ${Math.round(avgLatency * 100) / 100}ms`);
  console.log(`   Throughput trung bình: ${Math.round(avgThroughput * 100) / 100} req/s`);

  // Lưu kết quả vào file
  const fs = require('fs');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = `benchmark-report-${timestamp}.json`;
  fs.writeFileSync(reportFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    results
  }, null, 2));
  console.log(`\n💾 Đã lưu báo cáo chi tiết vào: ${reportFile}`);
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Bắt đầu benchmark...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🔑 Auth Token: ${AUTH_TOKEN ? 'Đã cung cấp' : 'Chưa có (một số API có thể fail)'}`);

  if (!AUTH_TOKEN) {
    console.log('\n⚠️  Cảnh báo: Chưa có AUTH_TOKEN, một số API protected có thể fail.');
    console.log('   Để test đầy đủ, hãy set AUTH_TOKEN trong .env hoặc export AUTH_TOKEN=your_token');
  }

  // Chạy từng scenario
  for (const scenario of scenarios) {
    try {
      await runScenario(scenario);
    } catch (error) {
      console.error(`\n❌ Lỗi khi chạy scenario ${scenario.name}:`, error.message);
    }
  }

  // In báo cáo tổng hợp
  printSummary();

  console.log('\n✅ Hoàn tất benchmark!');
}

// Chạy benchmark
main().catch(error => {
  console.error('❌ Lỗi khi chạy benchmark:', error);
  process.exit(1);
});

