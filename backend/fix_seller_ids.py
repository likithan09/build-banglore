import sqlite3

con = sqlite3.connect('kalasetu.db')
cur = con.cursor()

# Fix existing records where seller_id was set to buyer
cur.execute("UPDATE products SET seller_id = 'usr_artisan_channapatna' WHERE seller_id = 'usr_buyer_demo' OR seller_id IS NULL")
cur.execute("UPDATE orders SET seller_id = 'usr_artisan_channapatna' WHERE seller_id = 'usr_buyer_demo' OR seller_id IS NULL")
cur.execute("UPDATE inquiries SET seller_id = 'usr_artisan_channapatna' WHERE seller_id = 'usr_buyer_demo' OR seller_id IS NULL")
con.commit()

print("Products:")
for r in cur.execute("SELECT id, title, seller_id FROM products").fetchall():
    print(r)

print("\nOrders:")
for r in cur.execute("SELECT id, buyer_id, seller_id, total_amount, order_status FROM orders").fetchall():
    print(r)

print("\nInquiries:")
for r in cur.execute("SELECT id, buyer_id, seller_id, message, status FROM inquiries").fetchall():
    print(r)

con.close()
