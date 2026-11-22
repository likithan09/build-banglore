#!/usr/bin/env python3
"""
scripts/reindex_opensearch.py
Reindexes all published products and multilingual translations from PostgreSQL into Aiven OpenSearch.
"""

import asyncio
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from database import init_db
from opensearch_service import opensearch_service

async def main():
    print("[*] Initializing Database connection...")
    await init_db()
    print("[*] Reindexing all products into OpenSearch index...")
    count = await opensearch_service.reindex_all_products()
    print(f"[SUCCESS] Reindexed {count} products into Aiven OpenSearch index.")

if __name__ == "__main__":
    asyncio.run(main())
