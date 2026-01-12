# Database Schema & Models

## Overview

This document provides the complete SQLite database schema for the POS, Inventory, and Accounting system.

## Database Setup

```javascript
// electron/database/db.js
const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

class DatabaseManager {
  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'pos-accounting.db');
    this.db = new Database(dbPath);
    this.initialize();
  }

  initialize() {
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('synchronous = NORMAL');
  }

  close() {
    this.db.close();
  }
}

module.exports = new DatabaseManager();
```

## Complete Schema

### Core Tables

```sql
-- =====================
-- USERS & AUTHENTICATION
-- =====================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'cashier' CHECK(role IN ('admin', 'manager', 'cashier', 'accountant')),
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- =====================
-- CUSTOMERS
-- =====================

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  tax_number TEXT,
  credit_limit REAL DEFAULT 0,
  current_balance REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_customers_code ON customers(code);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_phone ON customers(phone);

-- =====================
-- SUPPLIERS
-- =====================

CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  tax_number TEXT,
  payment_terms INTEGER DEFAULT 30,
  current_balance REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_suppliers_code ON suppliers(code);
CREATE INDEX idx_suppliers_name ON suppliers(name);

-- =====================
-- PRODUCT CATEGORIES
-- =====================

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT REFERENCES categories(id),
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_categories_parent ON categories(parent_id);

-- =====================
-- PRODUCTS
-- =====================

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category_id TEXT REFERENCES categories(id),
  unit TEXT DEFAULT 'pcs',
  cost_price REAL DEFAULT 0,
  selling_price REAL NOT NULL,
  wholesale_price REAL,
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER,
  current_stock INTEGER DEFAULT 0,
  tax_rate REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  image_path TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_name ON products(name);

-- =====================
-- INVENTORY TRANSACTIONS
-- =====================

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  transaction_type TEXT NOT NULL CHECK(transaction_type IN ('purchase', 'sale', 'adjustment', 'return', 'transfer', 'damage')),
  quantity INTEGER NOT NULL,
  unit_cost REAL,
  reference_type TEXT,
  reference_id TEXT,
  notes TEXT,
  user_id TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_inv_trans_product ON inventory_transactions(product_id);
CREATE INDEX idx_inv_trans_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inv_trans_date ON inventory_transactions(created_at);

-- =====================
-- PURCHASE ORDERS
-- =====================

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'ordered', 'partial', 'received', 'cancelled')),
  order_date TEXT DEFAULT (datetime('now')),
  expected_date TEXT,
  received_date TEXT,
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  notes TEXT,
  user_id TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_po_number ON purchase_orders(order_number);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status ON purchase_orders(status);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity_ordered INTEGER NOT NULL,
  quantity_received INTEGER DEFAULT 0,
  unit_cost REAL NOT NULL,
  tax_rate REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  total REAL NOT NULL
);

CREATE INDEX idx_poi_order ON purchase_order_items(purchase_order_id);

-- =====================
-- SALES / POS
-- =====================

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id TEXT REFERENCES customers(id),
  sale_type TEXT DEFAULT 'retail' CHECK(sale_type IN ('retail', 'wholesale')),
  status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'void', 'returned')),
  subtotal REAL NOT NULL,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  amount_paid REAL DEFAULT 0,
  change_amount REAL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash', 'card', 'credit', 'mixed')),
  notes TEXT,
  user_id TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_sales_invoice ON sales(invoice_number);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_sales_status ON sales(status);

CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  cost_price REAL NOT NULL,
  tax_rate REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  total REAL NOT NULL
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

CREATE TABLE IF NOT EXISTS sale_payments (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL,
  amount REAL NOT NULL,
  reference_number TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- =====================
-- ACCOUNTING - CHART OF ACCOUNTS
-- =====================

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK(account_type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  parent_id TEXT REFERENCES accounts(id),
  description TEXT,
  is_system INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  current_balance REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_accounts_code ON accounts(code);
CREATE INDEX idx_accounts_type ON accounts(account_type);

-- =====================
-- ACCOUNTING - JOURNAL ENTRIES
-- =====================

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  entry_number TEXT UNIQUE NOT NULL,
  entry_date TEXT NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id TEXT,
  is_posted INTEGER DEFAULT 0,
  user_id TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_je_number ON journal_entries(entry_number);
CREATE INDEX idx_je_date ON journal_entries(entry_date);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id TEXT PRIMARY KEY,
  journal_entry_id TEXT NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  debit REAL DEFAULT 0,
  credit REAL DEFAULT 0,
  description TEXT
);

CREATE INDEX idx_jel_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_jel_account ON journal_entry_lines(account_id);

-- =====================
-- INVOICES (ACCOUNTS RECEIVABLE)
-- =====================

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  sale_id TEXT REFERENCES sales(id),
  invoice_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  subtotal REAL NOT NULL,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  amount_paid REAL DEFAULT 0,
  status TEXT DEFAULT 'unpaid' CHECK(status IN ('draft', 'unpaid', 'partial', 'paid', 'overdue', 'void')),
  notes TEXT,
  user_id TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- =====================
-- BILLS (ACCOUNTS PAYABLE)
-- =====================

CREATE TABLE IF NOT EXISTS bills (
  id TEXT PRIMARY KEY,
  bill_number TEXT UNIQUE NOT NULL,
  supplier_id TEXT NOT NULL REFERENCES suppliers(id),
  purchase_order_id TEXT REFERENCES purchase_orders(id),
  bill_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  subtotal REAL NOT NULL,
  tax_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  amount_paid REAL DEFAULT 0,
  status TEXT DEFAULT 'unpaid' CHECK(status IN ('draft', 'unpaid', 'partial', 'paid', 'overdue', 'void')),
  notes TEXT,
  user_id TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_bills_number ON bills(bill_number);
CREATE INDEX idx_bills_supplier ON bills(supplier_id);
CREATE INDEX idx_bills_status ON bills(status);

-- =====================
-- PAYMENTS
-- =====================

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  payment_number TEXT UNIQUE NOT NULL,
  payment_type TEXT NOT NULL CHECK(payment_type IN ('receipt', 'payment')),
  entity_type TEXT NOT NULL CHECK(entity_type IN ('customer', 'supplier')),
  entity_id TEXT NOT NULL,
  invoice_id TEXT,
  bill_id TEXT,
  payment_date TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  reference_number TEXT,
  notes TEXT,
  user_id TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_payments_number ON payments(payment_number);
CREATE INDEX idx_payments_entity ON payments(entity_type, entity_id);

-- =====================
-- SETTINGS
-- =====================

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- =====================
-- AUDIT LOG
-- =====================

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('insert', 'update', 'delete')),
  old_values TEXT,
  new_values TEXT,
  user_id TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_table ON audit_log(table_name);
CREATE INDEX idx_audit_record ON audit_log(record_id);
CREATE INDEX idx_audit_date ON audit_log(created_at);
```

## Migration System

```javascript
// electron/database/migrate.js
const db = require('./db');
const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, 'migrations');

function runMigrations() {
  // Create migrations tracking table
  db.db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      executed_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Get executed migrations
  const executed = db.db.prepare('SELECT name FROM migrations').all().map(r => r.name);

  // Get migration files
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  // Run pending migrations
  for (const file of files) {
    if (!executed.includes(file)) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      db.db.transaction(() => {
        db.db.exec(sql);
        db.db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
      })();

      console.log(`Completed: ${file}`);
    }
  }
}

runMigrations();
```

## Model Examples

### Product Model

```javascript
// electron/database/models/product.js
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const ProductModel = {
  findAll(options = {}) {
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (options.categoryId) {
      sql += ' AND category_id = ?';
      params.push(options.categoryId);
    }

    if (options.search) {
      sql += ' AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)';
      const search = `%${options.search}%`;
      params.push(search, search, search);
    }

    if (options.isActive !== undefined) {
      sql += ' AND is_active = ?';
      params.push(options.isActive ? 1 : 0);
    }

    sql += ' ORDER BY name';

    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    return db.db.prepare(sql).all(...params);
  },

  findById(id) {
    return db.db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  },

  findByBarcode(barcode) {
    return db.db.prepare('SELECT * FROM products WHERE barcode = ?').get(barcode);
  },

  create(data) {
    const id = uuidv4();
    const stmt = db.db.prepare(`
      INSERT INTO products (id, sku, barcode, name, description, category_id, unit,
        cost_price, selling_price, wholesale_price, min_stock_level, tax_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id, data.sku, data.barcode, data.name, data.description, data.categoryId,
      data.unit, data.costPrice, data.sellingPrice, data.wholesalePrice,
      data.minStockLevel, data.taxRate
    );

    return this.findById(id);
  },

  update(id, data) {
    const fields = [];
    const params = [];

    Object.keys(data).forEach(key => {
      fields.push(`${this.toSnakeCase(key)} = ?`);
      params.push(data[key]);
    });

    fields.push("updated_at = datetime('now')");
    params.push(id);

    db.db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  },

  updateStock(id, quantity, transactionType, userId, notes) {
    return db.db.transaction(() => {
      // Update product stock
      db.db.prepare('UPDATE products SET current_stock = current_stock + ? WHERE id = ?')
        .run(quantity, id);

      // Record inventory transaction
      db.db.prepare(`
        INSERT INTO inventory_transactions (id, product_id, transaction_type, quantity, user_id, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), id, transactionType, quantity, userId, notes);

      return this.findById(id);
    })();
  },

  getLowStock() {
    return db.db.prepare(`
      SELECT * FROM products
      WHERE current_stock <= min_stock_level AND is_active = 1
      ORDER BY (current_stock - min_stock_level)
    `).all();
  },

  toSnakeCase(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
};

module.exports = ProductModel;
```

### Sales Model

```javascript
// electron/database/models/sales.js
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const ProductModel = require('./product');

const SalesModel = {
  generateInvoiceNumber() {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = db.db.prepare(`
      SELECT COUNT(*) as count FROM sales
      WHERE date(created_at) = date('now')
    `).get().count;

    return `INV-${today}-${String(count + 1).padStart(4, '0')}`;
  },

  create(saleData) {
    return db.db.transaction(() => {
      const saleId = uuidv4();
      const invoiceNumber = this.generateInvoiceNumber();

      // Calculate totals
      let subtotal = 0;
      let taxAmount = 0;

      for (const item of saleData.items) {
        const itemTotal = item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100);
        const itemTax = itemTotal * (item.taxRate || 0) / 100;
        subtotal += itemTotal;
        taxAmount += itemTax;
      }

      const discountAmount = saleData.discountAmount || 0;
      const totalAmount = subtotal + taxAmount - discountAmount;

      // Insert sale
      db.db.prepare(`
        INSERT INTO sales (id, invoice_number, customer_id, sale_type, subtotal,
          tax_amount, discount_amount, total_amount, amount_paid, change_amount,
          payment_method, notes, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        saleId, invoiceNumber, saleData.customerId, saleData.saleType || 'retail',
        subtotal, taxAmount, discountAmount, totalAmount, saleData.amountPaid,
        Math.max(0, saleData.amountPaid - totalAmount), saleData.paymentMethod,
        saleData.notes, saleData.userId
      );

      // Insert sale items and update inventory
      const insertItem = db.db.prepare(`
        INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price,
          cost_price, tax_rate, discount_percent, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of saleData.items) {
        const product = ProductModel.findById(item.productId);
        const itemTotal = item.quantity * item.unitPrice * (1 - (item.discountPercent || 0) / 100);

        insertItem.run(
          uuidv4(), saleId, item.productId, item.quantity, item.unitPrice,
          product.cost_price, item.taxRate || 0, item.discountPercent || 0, itemTotal
        );

        // Decrease inventory
        ProductModel.updateStock(item.productId, -item.quantity, 'sale', saleData.userId);
      }

      // Insert payment records
      if (saleData.payments) {
        const insertPayment = db.db.prepare(`
          INSERT INTO sale_payments (id, sale_id, payment_method, amount, reference_number)
          VALUES (?, ?, ?, ?, ?)
        `);

        for (const payment of saleData.payments) {
          insertPayment.run(uuidv4(), saleId, payment.method, payment.amount, payment.reference);
        }
      }

      return this.findById(saleId);
    })();
  },

  findById(id) {
    const sale = db.db.prepare('SELECT * FROM sales WHERE id = ?').get(id);
    if (sale) {
      sale.items = db.db.prepare(`
        SELECT si.*, p.name as product_name, p.sku
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
      `).all(id);

      sale.payments = db.db.prepare('SELECT * FROM sale_payments WHERE sale_id = ?').all(id);
    }
    return sale;
  },

  findAll(filters = {}) {
    let sql = `
      SELECT s.*, c.name as customer_name, u.full_name as cashier_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.startDate) {
      sql += ' AND date(s.created_at) >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ' AND date(s.created_at) <= ?';
      params.push(filters.endDate);
    }

    if (filters.customerId) {
      sql += ' AND s.customer_id = ?';
      params.push(filters.customerId);
    }

    if (filters.status) {
      sql += ' AND s.status = ?';
      params.push(filters.status);
    }

    sql += ' ORDER BY s.created_at DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    return db.db.prepare(sql).all(...params);
  },

  voidSale(id, userId) {
    return db.db.transaction(() => {
      const sale = this.findById(id);
      if (!sale || sale.status === 'void') {
        throw new Error('Sale not found or already void');
      }

      // Restore inventory
      for (const item of sale.items) {
        ProductModel.updateStock(item.product_id, item.quantity, 'return', userId, `Void sale ${sale.invoice_number}`);
      }

      // Update sale status
      db.db.prepare("UPDATE sales SET status = 'void', updated_at = datetime('now') WHERE id = ?").run(id);

      return this.findById(id);
    })();
  },

  getDailySummary(date) {
    return db.db.prepare(`
      SELECT
        COUNT(*) as total_transactions,
        SUM(total_amount) as total_sales,
        SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END) as cash_sales,
        SUM(CASE WHEN payment_method = 'card' THEN total_amount ELSE 0 END) as card_sales,
        AVG(total_amount) as average_sale
      FROM sales
      WHERE date(created_at) = ? AND status = 'completed'
    `).get(date);
  }
};

module.exports = SalesModel;
```

## Database Utilities

```javascript
// electron/database/utils.js
const db = require('./db');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const DBUtils = {
  backup() {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}.db`);

    db.db.backup(backupPath);
    return backupPath;
  },

  restore(backupPath) {
    const currentDb = path.join(app.getPath('userData'), 'pos-accounting.db');
    db.close();
    fs.copyFileSync(backupPath, currentDb);
    // Reinitialize connection
    db.initialize();
  },

  vacuum() {
    db.db.exec('VACUUM');
  },

  getStats() {
    const tables = db.db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all();

    const stats = {};
    for (const { name } of tables) {
      stats[name] = db.db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get().count;
    }
    return stats;
  }
};

module.exports = DBUtils;
```
