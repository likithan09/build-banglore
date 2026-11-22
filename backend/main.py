import os
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import settings
from database import init_db, db
from opensearch_service import opensearch_service
from routes import auth, profile, products, ai, cart_orders, connections, admin, payments, notifications

DEMO_PRODUCTS = [
    {
        "id": "prd_channapatna_01",
        "seller_id": "usr_artisan_channapatna",
        "title": "Channapatna Handcrafted Lacquered Wooden Toys Set",
        "description": "Traditional wooden rocking horse and stacker toys handmade in Channapatna, Karnataka. Crafted from Ivory wood (Wrightia tinctoria) and finished with natural non-toxic vegetable dyes. Safe for children and eco-friendly.",
        "category": "Woodcraft",
        "price": 650.0,
        "stock": 45,
        "unit": "set",
        "tags": ["Channapatna", "Wooden Toys", "GI Tagged", "Eco Friendly", "Vegetable Dye"],
        "image_url": "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80",
        "enhanced_image_url": "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80#isolated_studio_bg",
        "original_language": "en-IN",
        "status": "published"
    },
    {
        "id": "prd_banarasi_02",
        "seller_id": "usr_artisan_varanasi",
        "title": "Handwoven Banarasi Pure Katan Silk Saree",
        "description": "Authentic Banarasi saree handwoven over 24 days by generational weavers in Varanasi, Uttar Pradesh. Features intricate gold zari kadwa motifs and rich pallu design. Certified handloom mark.",
        "category": "Handloom",
        "price": 4850.0,
        "stock": 18,
        "unit": "piece",
        "tags": ["Banarasi", "Handloom", "Pure Silk", "Zari Work", "Wedding Collection"],
        "image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80",
        "enhanced_image_url": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80#isolated_studio_bg",
        "original_language": "en-IN",
        "status": "published"
    },
    {
        "id": "prd_madhubani_03",
        "seller_id": "usr_artisan_mithila",
        "title": "Madhubani Traditional Folk Art Canvas Painting",
        "description": "Intricate Madhubani artwork rendered by women artisans of Mithila, Bihar using natural twig pens and organic mineral pigments. Depicts Tree of Life and harmonious nature motifs.",
        "category": "Painting",
        "price": 1450.0,
        "stock": 25,
        "unit": "piece",
        "tags": ["Madhubani", "Mithila Art", "Handmade Canvas", "Natural Pigments", "GI Tagged"],
        "image_url": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
        "enhanced_image_url": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80#isolated_studio_bg",
        "original_language": "en-IN",
        "status": "published"
    },
    {
        "id": "prd_bidriware_04",
        "seller_id": "usr_artisan_bidar",
        "title": "Bidriware Handcrafted Silver Inlay Flower Vase",
        "description": "Centuries-old metal handicraft from Bidar, Karnataka. Cast from an alloy of zinc and copper, blackened with historic soil from Bidar Fort and inlaid with pure silver sheet filigree work.",
        "category": "Metalcraft",
        "price": 2750.0,
        "stock": 12,
        "unit": "piece",
        "tags": ["Bidriware", "Silver Inlay", "GI Tagged", "Heritage Metalcraft", "Bidar"],
        "image_url": "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=800&q=80",
        "enhanced_image_url": "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=800&q=80#isolated_studio_bg",
        "original_language": "en-IN",
        "status": "published"
    }
]

async def seed_initial_demo_data():
    existing = await db.fetch_all("SELECT id FROM products LIMIT 1")
    if existing:
        return

    # Seed demo artisan profiles
    artisans = [
        ("usr_artisan_channapatna", "9876500001", "Rameshwar Gowda", "Woodcraft", "Channapatna Wooden Toys", "Karnataka", "Channapatna", "enrollment_id", "GSTEID20268FK9Q2LP4X"),
        ("usr_artisan_varanasi", "9876500002", "Ansari Weavers Guild", "Handloom", "Banarasi Silk Sarees", "Uttar Pradesh", "Varanasi", "gstin", "09AAACA1234F1Z5"),
        ("usr_artisan_mithila", "9876500003", "Sita Devi Mithila Collective", "Painting", "Madhubani Folk Paintings", "Bihar", "Madhubani", "enrollment_id", "GSTEID20269LP8K2M1Q7"),
        ("usr_artisan_bidar", "9876500004", "Rashid Ahmed Bidri Crafts", "Metalcraft", "Bidriware Metal Inlay", "Karnataka", "Bidar", "gstin", "29AAACB5678G1Z8")
    ]

    for usr_id, phone, name, cat, craft, state, city, vtype, vid in artisans:
        await db.execute(
            "INSERT OR IGNORE INTO users (id, phone, password_hash, role, created_at) VALUES (?, ?, 'demo_pwd_hash', 'artisan', ?)",
            (usr_id, phone, "2026-01-01T00:00:00")
        )
        await db.execute(
            """INSERT OR IGNORE INTO seller_profiles 
               (user_id, name, craft_category, craft_name, bio, state, city, languages_spoken, verification_type, verification_id, is_verified, capacity_per_month, profile_completed, completed_at)
               VALUES (?, ?, ?, ?, 'Generational heritage craft producer', ?, ?, '["en-IN", "hi-IN", "kn-IN"]', ?, ?, 1, 150, 1, ?)""",
            (usr_id, name, cat, craft, state, city, vtype, vid, "2026-01-01T00:00:00")
        )

    # Seed demo products & inventory
    for p in DEMO_PRODUCTS:
        await db.execute(
            """INSERT OR IGNORE INTO products 
               (id, seller_id, title, description, category, price, stock, unit, tags, image_url, enhanced_image_url, original_language, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                p["id"],
                p["seller_id"],
                p["title"],
                p["description"],
                p["category"],
                p["price"],
                p["stock"],
                p["unit"],
                json.dumps(p["tags"]),
                p["image_url"],
                p["enhanced_image_url"],
                p["original_language"],
                p["status"],
                "2026-01-01T00:00:00"
            )
        )
        await db.execute(
            "INSERT OR IGNORE INTO inventory (product_id, stock, reserved, updated_at) VALUES (?, ?, 0, ?)",
            (p["id"], p["stock"], "2026-01-01T00:00:00")
        )

    # Reindex into OpenSearch
    await opensearch_service.reindex_all_products()
    print("[*] Seeded 4 authentic Indian artisan profiles & products into PostgreSQL + OpenSearch.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_initial_demo_data()
    print(f"[*] {settings.PROJECT_NAME} v{settings.PROJECT_VERSION} initialized successfully.")
    print(f"[*] Aiven PostgreSQL: {settings.DATABASE_URL}")
    print(f"[*] Aiven Kafka Topics: {settings.AIVEN_KAFKA_TOPIC_PREFIX}*")
    print(f"[*] Aiven OpenSearch Index: {settings.OPENSEARCH_INDEX}")
    yield
    print("[*] Shutting down application services.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="KALASETU AI-Powered Voice-First Market Linkage Platform API",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads directory for product images
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Register routers
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(ai.router)
app.include_router(products.router)
app.include_router(cart_orders.router)
app.include_router(payments.router)
app.include_router(notifications.router)
app.include_router(connections.router)
app.include_router(admin.router)

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": settings.PROJECT_VERSION,
        "status": "online",
        "documentation": "/docs",
        "admin_kafka_events": "/api/admin/events"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "KALASETU Full-Stack Backend",
        "version": settings.PROJECT_VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
