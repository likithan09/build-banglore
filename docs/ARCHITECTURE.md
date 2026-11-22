# KALASETU (कलासेतु) — Architecture Specification

> **"Speak in your language. Connect to the right market."**  
> AI-Powered, Voice-First, Multilingual Marketplace Onboarding Platform for Marginalized Indian Artisans and Ethical Buyers.

---

## 🏛️ System Architecture Overview

```
                                  [ KALASETU CLIENT (React + Vite + Tailwind) ]
                                          Port 5174 (Mobile-First / PWA)
                                                  │
                                                  ▼
                               [ KALASETU BACKEND (Python FastAPI / ASGI) ]
                                                  │
                ┌─────────────────────────────────┼────────────────────────────────┐
                ▼                                 ▼                                ▼
       [ Aiven PostgreSQL ]             [ Aiven Apache Kafka ]           [ Aiven OpenSearch ]
   - users & sessions              - Topic: kalasetu.order.placed   - Index: kalasetu_products
   - seller_profiles & badges      - Topic: kalasetu.product.*      - Typo-tolerant fuzzy analyzers
   - buyer_profiles                - Topic: kalasetu.inquiry.*      - Multi-lingual title/desc match
   - products & translations map   - Topic: kalasetu.connection.*   - Dynamic translation index
   - inventory (row-level lock)    - Decoupled Idempotent Consumers - Search-as-you-type suggestions
                │
                ├─────────────────────────────────┬────────────────────────────────┐
                ▼                                 ▼                                ▼
    [ Sandbox.co.in API ]              [ Sarvam AI APIs ]             [ Mock GST Enrollment ]
  - GSTIN Verification               - Saarika/Saaras v4 (STT)       - Standalone microservice (Port 4000)
  - PAN Format & Checksum            - Bulbul v1 (TTS)               - 20-40s simulated async verification
  - Compliance Card UI               - Mayura v1 (Indic Translation) - Linkage to 5173 Demo Portal
```

---

## 💾 Mandatory Tech Stack & Data Responsibilities (§4)

### 1. Aiven PostgreSQL
* **Role**: Primary ACID relational datastore with strict data integrity.
* **Row-Level Inventory Locking**:
  ```sql
  UPDATE inventory 
  SET stock = stock - :quantity, updated_at = :now 
  WHERE product_id = :id AND stock >= :quantity;
  ```
  Guarantees two buyers can never purchase the last unit simultaneously.
* **Dynamic Translation Caching**: Product titles and descriptions are cached per language code in the `product_translations` table upon first lazy request via Sarvam Mayura.

### 2. Aiven Apache Kafka
* **Role**: Decoupled, asynchronous event pipeline powering idempotent consumers.
* **Outbox Pattern**:
  Backend commits transaction to PostgreSQL and writes to the `kafka_events` table before publishing to Kafka.
* **Core Event Topics & Consumer Actions**:
  - `kalasetu.order.placed`: Decoupled consumer reduces inventory atomically in PostgreSQL, emits `kalasetu.inventory.changed`, and triggers order confirmation.
  - `kalasetu.product.published` & `kalasetu.inventory.changed`: Keeps OpenSearch index strictly in sync.
  - `kalasetu.inquiry.created`: Creates artisan inbox notification and pushes match score breakdown.
  - `kalasetu.seller.profile.completed`: Computes initial buyer-seller match affinities.
* **Auditability**: All Kafka events and consumer logs are inspectable in real-time via `/admin/events`.

### 3. Aiven OpenSearch
* **Role**: Real-time discovery engine with Indic text analyzers.
* **Fuzzy Typo Tolerance**: Handles phonetic misspellings (e.g., `"banarsi"`, `"channapatna"`, `"bluetoth"`).
* **Multi-Field Relevance**: Indexes title, description, category, tags, state, and translated text in the user's selected language.

---

## 🇮🇳 Sarvam AI Voice & Indic Localization (§3)

* **Central Configuration**: All models and supported languages are defined centrally in `languages.config.json` (backend: `languages_config.py`, frontend: `src/i18n/languages.config.json`).
* **13 Supported Languages**: English, Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Odia, Assamese, and Urdu.
* **Graceful Degradation**: Where a language supports translation but not native acoustic STT/TTS (e.g. Assamese, Urdu), the mic/speaker buttons degrade cleanly with informative user messaging.
* **RTL Support**: Native Right-to-Left styling for languages utilizing Arabic scripts (Urdu).

---

## 🛡️ Compliance & Verification Engines (§5 & §6)

1. **Sandbox.co.in API (GSTIN Verification)**:
   - Evaluates 15-character GST structure and checksum locally.
   - Calls Sandbox compliance API to obtain Legal Name, Trade Name, Status, and Registration Date.
   - Renders a formal compliance card with transparent footer: *"Verified via Sandbox API (test environment)"*.

2. **Standalone Mock GST Enrollment Service (Port 4000)**:
   - Node.js + SQLite microservice simulating non-GST artisan enrolment.
   - Asynchronous state flip (`pending` to `verified` after 20–40 seconds).
   - Swappable provider class (`GstEnrollmentProvider`) enabling zero-refactor transition to production GSTN APIs.
   - Supports callback handshake from the existing Port 5173 GST enrollment portal.
