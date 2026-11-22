import os
import json
import sqlite3
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from config import settings

logger = logging.getLogger("kalasetu_database")

SQLITE_DB_PATH = os.path.join(os.path.dirname(__file__), "kalasetu.db")

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    phone TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL, -- 'artisan' or 'buyer'
    preferred_language TEXT DEFAULT 'hi-IN',
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS seller_profiles (
    user_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    business_name TEXT,
    craft_category TEXT NOT NULL,
    craft_name TEXT NOT NULL,
    bio TEXT,
    state TEXT NOT NULL,
    city TEXT NOT NULL,
    pincode TEXT DEFAULT '562160',
    profile_photo TEXT,
    languages_spoken TEXT, -- JSON array
    verification_type TEXT NOT NULL, -- 'gstin' or 'enrollment_id'
    verification_id TEXT NOT NULL,
    is_verified INTEGER DEFAULT 0,
    capacity_per_month INTEGER DEFAULT 100,
    profile_completed INTEGER DEFAULT 0,
    completed_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS buyer_profiles (
    user_id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    state TEXT NOT NULL,
    city TEXT NOT NULL,
    pincode TEXT DEFAULT '560001',
    gstin TEXT NOT NULL,
    is_verified INTEGER DEFAULT 0,
    profile_completed INTEGER DEFAULT 0,
    completed_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS gst_verifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    gstin TEXT,
    gstin_masked TEXT NOT NULL,
    legal_name TEXT NOT NULL,
    trade_name TEXT NOT NULL,
    status TEXT NOT NULL,
    registration_date TEXT,
    constitution TEXT,
    taxpayer_type TEXT,
    state_jurisdiction TEXT,
    address TEXT,
    reference_id TEXT NOT NULL,
    verified_at TEXT NOT NULL,
    raw_payload TEXT
);

CREATE TABLE IF NOT EXISTS enrollment_verifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    enrollment_id TEXT UNIQUE NOT NULL,
    pan TEXT,
    pan_masked TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT NOT NULL, -- 'pending' or 'verified'
    reference_id TEXT NOT NULL,
    verified_at TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    seller_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL DEFAULT 10,
    unit TEXT DEFAULT 'piece',
    tags TEXT, -- JSON array
    image_url TEXT,
    enhanced_image_url TEXT,
    original_language TEXT DEFAULT 'en-IN',
    status TEXT DEFAULT 'published', -- 'draft', 'published', 'archived'
    created_at TEXT NOT NULL,
    FOREIGN KEY(seller_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS product_translations (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    language_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT, -- JSON array
    cached_at TEXT NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id),
    UNIQUE(product_id, language_code)
);

CREATE TABLE IF NOT EXISTS inventory (
    product_id TEXT PRIMARY KEY,
    stock INTEGER NOT NULL DEFAULT 0,
    reserved INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS carts (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS cart_items (
    id TEXT PRIMARY KEY,
    cart_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    created_at TEXT,
    FOREIGN KEY(cart_id) REFERENCES carts(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    buyer_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal REAL DEFAULT 0.0,
    gst_amount REAL DEFAULT 0.0,
    total_amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'RAZORPAY',
    payment_status TEXT DEFAULT 'created', -- 'created', 'captured', 'failed'
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    shipping_address TEXT,
    order_status TEXT DEFAULT 'confirmed', -- 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'
    created_at TEXT NOT NULL,
    FOREIGN KEY(buyer_id) REFERENCES users(id),
    FOREIGN KEY(product_id) REFERENCES products(id),
    FOREIGN KEY(seller_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    razorpay_order_id TEXT NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amount INTEGER NOT NULL, -- in paise
    currency TEXT DEFAULT 'INR',
    status TEXT NOT NULL, -- 'created', 'captured', 'failed'
    created_at TEXT NOT NULL,
    FOREIGN KEY(order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    buyer_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    message TEXT NOT NULL,
    quantity_needed INTEGER DEFAULT 1,
    target_timeline TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    created_at TEXT NOT NULL,
    FOREIGN KEY(buyer_id) REFERENCES users(id),
    FOREIGN KEY(seller_id) REFERENCES users(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    inquiry_id TEXT NOT NULL,
    buyer_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL,
    FOREIGN KEY(inquiry_id) REFERENCES inquiries(id),
    FOREIGN KEY(buyer_id) REFERENCES users(id),
    FOREIGN KEY(seller_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    connection_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    message_text TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(connection_id) REFERENCES connections(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link_tab TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS kafka_events (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    event_key TEXT,
    payload TEXT NOT NULL,
    status TEXT DEFAULT 'published',
    consumer_action TEXT,
    created_at TEXT NOT NULL,
    processed_at TEXT
);
"""

class Database:
    def __init__(self):
        self._init_sqlite()

    def _get_connection(self):
        conn = sqlite3.connect(SQLITE_DB_PATH, check_same_thread=False, timeout=30.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_sqlite(self):
        conn = self._get_connection()
        try:
            conn.executescript(SCHEMA_SQL)
            
            # Safe column migrations for existing tables
            migration_columns = [
                ("users", "preferred_language", "TEXT DEFAULT 'hi-IN'"),
                ("seller_profiles", "business_name", "TEXT"),
                ("seller_profiles", "pincode", "TEXT DEFAULT '562160'"),
                ("buyer_profiles", "pincode", "TEXT DEFAULT '560001'"),
                ("orders", "subtotal", "REAL DEFAULT 0.0"),
                ("orders", "gst_amount", "REAL DEFAULT 0.0"),
                ("orders", "payment_method", "TEXT DEFAULT 'RAZORPAY'"),
                ("orders", "payment_status", "TEXT DEFAULT 'created'"),
                ("orders", "razorpay_order_id", "TEXT"),
                ("orders", "razorpay_payment_id", "TEXT"),
                ("orders", "shipping_address", "TEXT"),
                ("orders", "order_status", "TEXT DEFAULT 'confirmed'"),
                ("carts", "updated_at", "TEXT"),
                ("cart_items", "created_at", "TEXT"),
                ("gst_verifications", "gstin", "TEXT"),
                ("enrollment_verifications", "pan", "TEXT")
            ]
            for table, col, col_type in migration_columns:
                try:
                    conn.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
                except sqlite3.OperationalError:
                    pass # Column already exists
                    
            conn.commit()
            logger.info("[Database] Schema and migrations initialized successfully.")
        finally:
            conn.close()

    async def execute(self, query: str, params: tuple = ()) -> None:
        conn = self._get_connection()
        try:
            conn.execute(query, params)
            conn.commit()
        finally:
            conn.close()

    async def fetch_one(self, query: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(query, params)
            row = cur.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    async def fetch_all(self, query: str, params: tuple = ()) -> List[Dict[str, Any]]:
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute(query, params)
            rows = cur.fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    async def reduce_stock_atomic(self, product_id: str, quantity: int) -> bool:
        conn = self._get_connection()
        try:
            cur = conn.cursor()
            cur.execute("BEGIN IMMEDIATE")
            cur.execute(
                "UPDATE inventory SET stock = stock - ?, updated_at = ? WHERE product_id = ? AND stock >= ?",
                (quantity, datetime.utcnow().isoformat(), product_id, quantity)
            )
            if cur.rowcount > 0:
                cur.execute(
                    "UPDATE products SET stock = stock - ? WHERE id = ?",
                    (quantity, product_id)
                )
                conn.commit()
                return True
            else:
                conn.rollback()
                return False
        except Exception as e:
            conn.rollback()
            logger.error(f"[Database] Atomic stock reduction error: {e}")
            return False
        finally:
            conn.close()

db = Database()

async def init_db():
    logger.info("[Database] Persistent store ready.")
