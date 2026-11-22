# KALASETU — End-to-End Click-by-Click Demo Script

Follow this step-by-step evaluation script to test all capabilities of **KALASETU**.

---

## 🎬 Prerequisites
Start all microservices:
```bash
# 1. Start Mock GST Enrollment Service (Port 4000)
cd services/gst-enrollment-mock && npm start

# 2. Start KALASETU Backend (Port 8000)
cd backend && python main.py

# 3. Start Frontend (Port 5174)
cd frontend && npm run dev
```

---

## 📌 Scene 1: Register as Artisan with GSTIN (Branch A - YES)
1. Open `http://localhost:5174/` in your browser.
2. Click **Enter Platform** from the Splash Screen.
3. In the registration modal:
   - Select **New User Registration**
   - Account Type: Select **Artisan / Seller**
   - Mobile: `9876511111`
   - Password: `password123`
   - Click **Register & Continue**.
4. You are directed to the **Artisan Compliance & Identity Verification** gate (§1 Flowchart).
5. Click **YES, I have GSTIN**.
6. Enter `29AAACA1234F1Z5` and click **Verify via Sandbox API**.
7. Observe the verified **GST Compliance Card**:
   - Shows Legal Name: *Shree Kaveri Artisan Enterprises*
   - Status: *Active (Green badge)*
   - State Jurisdiction: *Karnataka*
   - Honest Footer: *Verified via Sandbox API (test environment)*.
8. Click **Proceed to Profile**.
9. Complete the profile checklist (Craft name, monthly capacity, location) and click **Complete Profile**.
10. Click **Open AI-Powered Platform for Sellers**.

---

## 📌 Scene 2: AI-Powered Platform for Sellers
1. Navigate to the **AI Platform (Seller)** tab.
2. **Image Enhancement Demo**:
   - Click **Enhance & Remove Background**.
   - Observe the real-time quality report (Sharpness 94%, Blur Check: Passed, Background Isolated).
3. **Voice & Speech-to-Text Demo**:
   - Click the Mic button.
   - Observe Sarvam Saaras v4 transcription in the selected Indic language.
   - Click **Listen** to trigger Bulbul text-to-speech audio synthesis.
4. **Fair Price Recommendation Demo**:
   - Enter Material Cost: `180`, Labor Hours: `3.5`, Current Price: `350`.
   - Click **Calculate Fair Price**.
   - Notice the **Under-pricing Warning**: alerts the artisan that ₹350 is below the ₹820 fair living wage floor.
5. **Minimal Add Product Flow**:
   - Click **+ Add Product to Marketplace**.
   - Review the AI Smart Catalogue draft.
   - Modify the price to `650` and confirm the materials note.
   - Click **Approve & Publish to Marketplace**.
   - Observe product published into PostgreSQL, inventory row initialized, and `kalasetu.product.published` event emitted to Kafka!

---

## 📌 Scene 3: Register as Artisan with No GST (Branch A - NO)
1. Logout and click **Register**.
2. Mobile: `9876522222`, Password: `password123`, Role: **Artisan**.
3. Under Compliance, select **NO GSTIN (Marginalized)**.
4. Fill PAN: `ABCDE1234F`, Name: `Rameshwar Rao`, Email: `ramesh@artisan.in`, Address: `Channapatna`.
5. Click **Generate Enrollment ID**.
6. Observe the **Live Verification Tracker**:
   - Shows `GSTEID2026...` in *Pending* status.
   - Background simulated verification completes in 20–40 seconds.
   - Badge flips to **Enrollment ID Verified (Marginalized Artisan)**.
   *(Optional: You can also launch the Port 5173 standalone demo portal via the link to test the redirect_uri callback).*
7. Complete profile.

---

## 📌 Scene 4: Buyer Registration & OpenSearch Discovery (Branch B)
1. Logout and Register as **Buyer**:
   - Mobile: `9876533333`, Password: `password123`, Role: **Buyer**.
2. Complete Buyer Verification with GSTIN `29AAACA1234F1Z5`.
3. Enter the **Marketplace**.
4. **Test OpenSearch Fuzzy Typo Tolerance**:
   - Type `"banarsi"` (intentional typo for Banarasi) into the search bar.
   - Notice that the pure silk Banarasi Saree is immediately returned with high relevance score!
   - Type `"bluetoth"` or `"channapatna"` to test edit distance tolerance.
5. **Test Language Switcher on Every Screen (§3 Mandate)**:
   - Change the header language dropdown to **हिन्दी (Hindi)**.
   - The entire UI, titles, placeholders, and labels instantly re-render in Hindi without reloading!
   - Switch to **ಕನ್ನಡ (Kannada)**, **தமிழ் (Tamil)**, and **বাংলা (Bengali)**.

---

## 📌 Scene 5: Cart, Kafka Order Placement & Atomic Stock Reduction
1. Click on the *Channapatna Handcrafted Wooden Toys Set*.
2. Note the initial **Stock: 45 units**.
3. Review the **AI Buyer-Seller Match Score (92% - Excellent Match)** with explainability breakdown factors.
4. Click **Add to Cart**.
5. In the cart drawer, click **Place Order (Kafka Stock Reduction Demo)**.
6. Observe the order confirmation:
   - Order saved in PostgreSQL.
   - `kalasetu.order.placed` event published to Aiven Kafka.
   - Decoupled consumer executes atomic stock reduction on PostgreSQL row.
   - Stock count instantly drops from **45 to 44 units**!

---

## 📌 Scene 6: Buyer-Seller Connection Flow
1. Click on another craft item (e.g. *Madhubani Folk Painting*).
2. Click **Connect & Send Inquiry to Artisan**.
3. Set Quantity: `50`, Timeline: `Within 3 weeks`, Message: *"We want to stock this across our 5 retail branches."*
4. Click **Submit Inquiry to Seller Inbox**.
5. Logout and Login as the artisan (`9876511111`).
6. Navigate to **Inquiries**.
7. View the incoming inquiry with buyer details and match affinity score.
8. Click **Accept Connection**.
9. Click **View Connected Buyers**.
10. The **Connections Hub** opens: both parties now have direct contact visibility and an active real-time chat thread stub!

---

## 📌 Scene 7: Kafka Event Stream Audit (`/admin/events`)
1. Click **Kafka Events Stream** in the top navigation bar.
2. Inspect the live event log:
   - `kalasetu.user.registered`
   - `kalasetu.seller.profile.completed`
   - `kalasetu.product.published`
   - `kalasetu.cart.item.added`
   - `kalasetu.order.placed`
   - `kalasetu.inventory.changed`
   - `kalasetu.inquiry.created`
   - `kalasetu.connection.accepted`
3. Click any event to inspect its full payload JSON, topic key, timestamp, and consumer execution action.
