# Mock GST Enrollment ID Service

> **IMPORTANT DISCLAIMER:**  
> **This is a standalone MOCK service.** It is NOT connected to or endorsed by the Goods and Services Tax Network (GSTN), Ministry of Finance, or any Government of India entity. It simulates an e-commerce platform-issued enrolment ID service (similar to Meesho's non-GST artisan enrolment flow) for demonstration and architectural evaluation within **KALASETU**.

---

## 🏛️ Purpose & Design

The service provides a clean, swappable interface so that:
1. Marginalized artisans without standard GSTIN can receive a compliant simulated Enrollment ID (`GSTEID<YYYY><10-chars>`).
2. An asynchronous verification workflow is triggered (`pending` status transitions to `verified` after 20–40 seconds).
3. The KALASETU backend communicates exclusively through an adapter class (`GstEnrollmentProvider`), allowing this mock to be swapped with a production government API later with zero changes to callers.

---

## 🚀 Running the Service

### Prerequisites
- Node.js (v18+)

### Starting the Service
```bash
cd services/gst-enrollment-mock
npm start
# Service listens on http://localhost:4000
```

---

## 📡 API Endpoints & cURL Examples

### 1. Health Check
```bash
curl -X GET http://localhost:4000/enrollment/health
```
**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "Mock GST Enrollment Service",
  "version": "1.0.0",
  "totalEnrollments": 0,
  "timestamp": "2026-11-21T21:40:00.000Z"
}
```

### 2. Initiate Enrollment
```bash
curl -X POST http://localhost:4000/enrollment/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "pan": "ABCDE1234F",
    "fullName": "Rameshwar Rao",
    "email": "rameshwar@artisan.in",
    "address": "12 Crafts Nagar, Channapatna, Karnataka"
  }'
```
**Response (201 Created):**
```json
{
  "success": true,
  "enrollmentId": "GSTEID20268FK9Q2LP4X",
  "status": "pending",
  "message": "Enrollment initiated successfully. Verification in progress.",
  "createdAt": "2026-11-21T21:40:00.000Z"
}
```

### 3. Check Enrollment Status
```bash
curl -X GET http://localhost:4000/enrollment/status/GSTEID20268FK9Q2LP4X
```
**Initial Response (200 OK):**
```json
{
  "enrollmentId": "GSTEID20268FK9Q2LP4X",
  "status": "pending",
  "pan": "ABCDE1234F",
  "fullName": "Rameshwar Rao",
  "email": "rameshwar@artisan.in",
  "address": "12 Crafts Nagar, Channapatna, Karnataka",
  "createdAt": "2026-11-21T21:40:00.000Z",
  "verifiedAt": null
}
```

**After 20–40 Seconds (200 OK):**
```json
{
  "enrollmentId": "GSTEID20268FK9Q2LP4X",
  "status": "verified",
  "pan": "ABCDE1234F",
  "fullName": "Rameshwar Rao",
  "email": "rameshwar@artisan.in",
  "address": "12 Crafts Nagar, Channapatna, Karnataka",
  "createdAt": "2026-11-21T21:40:00.000Z",
  "verifiedAt": "2026-11-21T21:40:32.410Z"
}
```
