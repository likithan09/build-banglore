/**
 * Standalone Mock "GST Enrollment ID" Service
 * Simulates platform-issued GST Enrollment IDs for marginalized artisans without GSTIN.
 * 
 * NOTE: This is NOT a real government integration. It is a compliant simulation service
 * for demonstration and onboarding linkage within KALASETU.
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4000;
const DB_FILE = path.join(__dirname, 'enrollments.json');

// Initialize local persistence
let enrollments = {};
try {
  if (fs.existsSync(DB_FILE)) {
    enrollments = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  }
} catch (e) {
  console.warn('[Mock GST] Failed to load database file, initializing empty store:', e.message);
  enrollments = {};
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(enrollments, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Mock GST] Failed to persist database:', e.message);
  }
}

// Generate random uppercase alphanumeric string
function generateRandomAlphanumeric(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Validation helpers
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateInitiatePayload(body) {
  const errors = {};

  if (!body.pan || typeof body.pan !== 'string' || !PAN_REGEX.test(body.pan.trim().toUpperCase())) {
    errors.pan = 'Invalid PAN format. Must be 5 uppercase letters, 4 digits, 1 uppercase letter (e.g. ABCDE1234F).';
  }

  if (!body.fullName || typeof body.fullName !== 'string' || body.fullName.trim().length === 0) {
    errors.fullName = 'Full name is required and cannot be empty.';
  }

  if (!body.email || typeof body.email !== 'string' || !EMAIL_REGEX.test(body.email.trim())) {
    errors.email = 'Valid email address is required.';
  }

  if (!body.address || typeof body.address !== 'string' || body.address.trim().length === 0) {
    errors.address = 'Address is required and cannot be empty.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Schedule simulated async verification (20 - 40 seconds)
function scheduleVerification(enrollmentId, delaySeconds = null) {
  const delay = delaySeconds ? delaySeconds * 1000 : (Math.floor(Math.random() * 20) + 20) * 1000;
  console.log(`[Mock GST] Scheduled simulated verification for ${enrollmentId} in ${(delay / 1000).toFixed(1)}s`);

  setTimeout(() => {
    if (enrollments[enrollmentId] && enrollments[enrollmentId].status === 'pending') {
      enrollments[enrollmentId].status = 'verified';
      enrollments[enrollmentId].verifiedAt = new Date().toISOString();
      saveDb();
      console.log(`[Mock GST] Simulated verification COMPLETED for Enrollment ID: ${enrollmentId} (Status: verified)`);
    }
  }, delay);
}

// Helper to send JSON responses
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key'
  });
  res.end(JSON.stringify(data));
}

// HTTP Server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key'
    });
    res.end();
    return;
  }

  // 1. Health Endpoint
  if (method === 'GET' && (pathname === '/enrollment/health' || pathname === '/health')) {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'Mock GST Enrollment Service',
      version: '1.0.0',
      totalEnrollments: Object.keys(enrollments).length,
      timestamp: new Date().toISOString()
    });
  }

  // 2. Initiate Enrollment Endpoint: POST /enrollment/initiate
  if (method === 'POST' && pathname === '/enrollment/initiate') {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk.toString();
    });

    req.on('end', () => {
      try {
        const body = bodyData ? JSON.parse(bodyData) : {};
        const validation = validateInitiatePayload(body);

        if (!validation.isValid) {
          return sendJson(res, 400, {
            success: false,
            message: 'Validation failed on enrollment initiation payload.',
            errors: validation.errors
          });
        }

        const year = new Date().getFullYear();
        const randomCode = generateRandomAlphanumeric(10);
        const enrollmentId = `GSTEID${year}${randomCode}`;
        const createdAt = new Date().toISOString();

        const enrollmentRecord = {
          enrollmentId,
          pan: body.pan.trim().toUpperCase(),
          fullName: body.fullName.trim(),
          email: body.email.trim(),
          address: body.address.trim(),
          status: 'pending',
          createdAt,
          verifiedAt: null
        };

        enrollments[enrollmentId] = enrollmentRecord;
        saveDb();

        // Check if fast verification requested for tests (optional query param ?fast=true)
        const delay = parsedUrl.query.fast === 'true' ? 2 : null;
        scheduleVerification(enrollmentId, delay);

        return sendJson(res, 201, {
          success: true,
          enrollmentId,
          status: 'pending',
          message: 'Enrollment initiated successfully. Verification in progress.',
          createdAt
        });
      } catch (err) {
        return sendJson(res, 400, {
          success: false,
          error: 'Invalid JSON request body.',
          details: err.message
        });
      }
    });
    return;
  }

  // 3. Status Endpoint: GET /enrollment/status/:id
  if (method === 'GET' && pathname.startsWith('/enrollment/status/')) {
    const id = pathname.replace('/enrollment/status/', '').trim();
    if (!id || !enrollments[id]) {
      return sendJson(res, 404, {
        success: false,
        error: `Enrollment ID '${id}' not found.`
      });
    }

    const record = enrollments[id];
    return sendJson(res, 200, {
      enrollmentId: record.enrollmentId,
      status: record.status,
      pan: record.pan,
      fullName: record.fullName,
      email: record.email,
      address: record.address,
      createdAt: record.createdAt,
      verifiedAt: record.verifiedAt
    });
  }

  // Fallback 404
  return sendJson(res, 404, {
    error: 'Endpoint not found',
    availableEndpoints: [
      'POST /enrollment/initiate',
      'GET /enrollment/status/:id',
      'GET /enrollment/health'
    ]
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  MOCK GST ENROLLMENT SERVICE RUNNING ON PORT ${PORT} `);
  console.log(`  http://localhost:${PORT}/enrollment/health          `);
  console.log(`  [SIMULATION ONLY - NOT INTEGRATED WITH GSTN]        `);
  console.log(`=======================================================`);
});
