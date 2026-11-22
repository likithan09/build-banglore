# KALASETU (कलासेतु)
> **"Speak in your language. Connect to the right market."**  
> AI-Powered, Voice-First, Multilingual Marketplace Onboarding Platform for Marginalized Indian Artisans and Ethical Buyers.

---

## 🏛️ Monorepo Architecture

```
build banglore/
├── services/
│   └── gst-enrollment-mock/    # Standalone Mock GST Enrollment ID Service (Node.js, Port 4000)
├── backend/                    # Python FastAPI / ASGI Backend (Port 8000)
├── frontend/                   # Voice-First React Application (Port 5174)
├── gst-demo/                   # Standalone GST Enrollment Demo Portal (Port 5173)
├── scripts/                    # Management & Verification Scripts
│   ├── generate_i18n.py        # Generates Indic locale JSON files from Sarvam models
│   ├── test_languages.py       # Automated Indic language compatibility test suite
│   ├── reindex_opensearch.py   # Re-indexes PostgreSQL data into OpenSearch
│   └── seed_data.py            # Seeds authentic artisan profiles & products
├── docs/                       # Architecture, Demo Script, & One-Page Technical Pitch
│   ├── ARCHITECTURE.md
│   ├── DEMO_SCRIPT.md
│   └── ONE_PAGE_PITCH.md
├── languages.config.json       # Central Sarvam models & supported languages matrix
└── docker-compose.yml          # Containerized local execution
```

---

## ⚖️ Honest Disclaimers & Regulatory Notices

1. **Mock GST Enrollment ID Service (`services/gst-enrollment-mock`)**:
   - **MOCK ONLY:** This service is a standalone simulation microservice (similar to platform-issued enrollment IDs used by major Indian marketplaces for non-GST sellers). It is **NOT** connected to or affiliated with the Goods and Services Tax Network (GSTN) or the Ministry of Finance. It is designed to be swappable with official APIs without refactoring callers.
2. **Sandbox API Verification**:
   - The compliance verification card connects to Sandbox.co.in APIs. When test credentials are used, it displays realistic Indian craft enterprise data with the honest footer: *"Verified via Sandbox API (test environment)"*.

---

## 🚀 One-Command Local Run

### Option A: Using Docker Compose
```bash
docker-compose up --build
```

### Option B: Native Local Run

#### 1. Start Mock GST Enrollment Service (Port 4000)
```bash
cd services/gst-enrollment-mock
npm start
# http://localhost:4000/enrollment/health
```

#### 2. Start KALASETU Backend (Port 8000)
```bash
cd backend
python main.py
# API Docs: http://localhost:8000/docs
# Kafka Events Stream: http://localhost:8000/api/admin/events
```

#### 3. Start Frontend (Port 5174)
```bash
cd frontend
npm run dev
# Application: http://localhost:5174/
```

#### 4. (Optional) Start GST Enrollment Demo Portal (Port 5173)
```bash
cd gst-demo
npm run dev
# Portal: http://localhost:5173/
```

---

## 🧪 Automated Testing & Verification

### Run Automated Image Enhancer Verification Test Suite (Step 6)
Runs the 4 mandatory test photos (plain background, cluttered workshop, small crop <2%, corrupt file), measures RGB color delta preservation, and logs per-step timings:
```bash
python tests/test_image_enhancer.py
```

### Run Language Compliance Test Suite (§3 Mandate)
Verifies that all 13 supported Indic languages have valid translation dictionaries and adhere to Sarvam STT/TTS capability matrices:
```bash
python scripts/test_languages.py
```

### Run OpenSearch Reindexing
```bash
python scripts/reindex_opensearch.py
```

---

## 🔑 Environment Configuration (`backend/.env.example`)

Copy `backend/.env.example` to `backend/.env` to configure your live credentials:

| Variable | Description |
| :--- | :--- |
| `AIVEN_PG_URI` | Aiven PostgreSQL connection URI (`ssl=require`) |
| `AIVEN_KAFKA_BOOTSTRAP_SERVERS` | Aiven Apache Kafka bootstrap endpoint |
| `AIVEN_OPENSEARCH_URI` | Aiven OpenSearch HTTPS endpoint |
| `SARVAM_API_KEY` | Sarvam AI API key (Saaras v4 STT, Bulbul v1 TTS, Mayura) |
| `SANDBOX_API_KEY` | Sandbox.co.in API Key for GSTIN verification |
| `SANDBOX_API_SECRET` | Sandbox.co.in API Secret |
| `MOCK_ENROLLMENT_SERVICE_URL` | URL to mock enrollment service (`http://localhost:4000`) |

---

## 🌟 Key Functional Highlights

1. **Flowchart Onboarding**: Clean separation of Artisan (GSTIN vs Mock Enrollment ID) and Buyer branches.
2. **AI-Powered Suite for Sellers**: Background isolation, voice-to-text, SEO tags, fair price recommendations, and artisan review gates.
3. **Decoupled Kafka Architecture**: Orders emit `order.placed` into Kafka, where background consumers execute atomic row-level inventory reduction on PostgreSQL.
4. **OpenSearch Discovery**: Fuzzy typo tolerance allows queries like `"banarsi"` or `"bluetoth"` to accurately resolve certified artisan products.
5. **13-Language Instant UI Switch**: Header language switcher re-renders the complete UI in real-time across regional scripts.
