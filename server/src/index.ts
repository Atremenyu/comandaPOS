
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

const dbPromise = open({
  filename: path.join(__dirname, '../database.sqlite'),
  driver: sqlite3.Database
});

async function setupDb() {
  const db = await dbPromise;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      status TEXT DEFAULT 'active' -- 'active' or 'closed'
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      client TEXT,
      "table" TEXT,
      payment TEXT,
      status TEXT, -- 'pending', 'accepted', 'ready', 'delivered'
      total REAL,
      estimated_ready_at DATETIME,
      shift_id INTEGER,
      FOREIGN KEY (shift_id) REFERENCES shifts(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT,
      product_id TEXT,
      name TEXT,
      price REAL,
      quantity INTEGER,
      note TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  // Check if an active shift exists, if not create one
  const activeShift = await db.get("SELECT * FROM shifts WHERE status = 'active'");
  if (!activeShift) {
    await db.run("INSERT INTO shifts (status) VALUES ('active')");
  }
}

setupDb();

// API Routes
app.get('/api/products', async (req, res) => {
  const db = await dbPromise;
  const products = await db.all("SELECT * FROM products");
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  const db = await dbPromise;
  const { id, name, price, category } = req.body;
  await db.run("INSERT INTO products (id, name, price, category) VALUES (?, ?, ?, ?)", [id, name, price, category]);
  res.status(201).json({ id, name, price, category });
});

app.get('/api/categories', async (req, res) => {
    const db = await dbPromise;
    const categories = await db.all("SELECT * FROM categories");
    res.json(categories.map(c => c.name));
});

app.post('/api/categories', async (req, res) => {
    const db = await dbPromise;
    const { name } = req.body;
    await db.run("INSERT OR IGNORE INTO categories (name) VALUES (?)", [name]);
    res.status(201).json({ name });
});

app.get('/api/orders/active-shift', async (req, res) => {
    const db = await dbPromise;
    const activeShift = await db.get("SELECT id FROM shifts WHERE status = 'active'");
    if (!activeShift) return res.json([]);

    const orders = await db.all("SELECT * FROM orders WHERE shift_id = ?", [activeShift.id]);
    for (let order of orders) {
        order.items = await db.all("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
    }
    res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  const db = await dbPromise;
  const activeShift = await db.get("SELECT id FROM shifts WHERE status = 'active'");
  if (!activeShift) return res.status(400).json({ error: "No active shift" });

  const { id, client, table, payment, status, total, items } = req.body;

  await db.run(
    "INSERT INTO orders (id, client, \"table\", payment, status, total, shift_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, client, table, payment, status, total, activeShift.id]
  );

  for (let item of items) {
    await db.run(
      "INSERT INTO order_items (order_id, product_id, name, price, quantity, note) VALUES (?, ?, ?, ?, ?, ?)",
      [id, item.id, item.name, item.price, item.quantity, item.note]
    );
  }

  const newOrder = { id, client, table_name, payment, status, total, items, created_at: new Date().toISOString() };
  io.emit('new-order', newOrder);
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id/status', async (req, res) => {
    const db = await dbPromise;
    const { id } = req.params;
    const { status, estimated_ready_at } = req.body;

    if (estimated_ready_at) {
        await db.run("UPDATE orders SET status = ?, estimated_ready_at = ? WHERE id = ?", [status, estimated_ready_at, id]);
    } else {
        await db.run("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
    }

    const updatedOrder = await db.get("SELECT * FROM orders WHERE id = ?", [id]);
    io.emit('order-updated', updatedOrder);
    res.json(updatedOrder);
});

app.post('/api/shifts/close', async (req, res) => {
    const db = await dbPromise;
    const activeShift = await db.get("SELECT * FROM shifts WHERE status = 'active'");
    if (!activeShift) return res.status(400).json({ error: "No active shift" });

    // Mark pending orders as not dispatched (stay as pending/accepted/ready but shift is closed)
    // Actually, per requirements, we should mark them in the report.

    await db.run("UPDATE shifts SET end_time = CURRENT_TIMESTAMP, status = 'closed' WHERE id = ?", [activeShift.id]);

    // Create new shift
    await db.run("INSERT INTO shifts (status) VALUES ('active')");

    res.json({ message: "Shift closed" });
});

// Reporting API
app.get('/api/reports/history', async (req, res) => {
    const db = await dbPromise;
    const { period, date } = req.query; // period: day, week, month, year

    let query = "SELECT * FROM orders";
    let params: any[] = [];

    if (period === 'day') {
        query += " WHERE date(created_at) = date(?)";
        params.push(date);
    } else if (period === 'month') {
        query += " WHERE strftime('%Y-%m', created_at) = ?";
        params.push(date); // YYYY-MM
    } else if (period === 'year') {
        query += " WHERE strftime('%Y', created_at) = ?";
        params.push(date); // YYYY
    } else if (period === 'week') {
        query += " WHERE created_at >= date(?, '-7 days')";
        params.push(date);
    }

    const orders = await db.all(query, params);
    for (let order of orders) {
        order.items = await db.all("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
    }
    res.json(orders);
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
