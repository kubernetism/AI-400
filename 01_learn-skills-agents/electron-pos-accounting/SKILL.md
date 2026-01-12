---
name: electron-pos-accounting
description: Develop Electron.js applications for accounting, inventory management, and point of sales (POS) with SQLite database. Use when building desktop business applications, POS systems, inventory tracking, financial software, invoicing, billing, stock management, or when the user mentions Electron, SQLite, accounting, inventory, or POS development. Use Context7 MCP to fetch up-to-date documentation for libraries.
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, mcp__context7__resolve-library-id, mcp__context7__get-library-docs
---

# Electron.js POS, Accounting & Inventory Management Skill

## Overview

This skill helps you build comprehensive desktop business applications using Electron.js with SQLite database, covering:

- **Point of Sales (POS)**: Sales transactions, receipts, customer management
- **Inventory Management**: Stock tracking, purchase orders, suppliers
- **Accounting**: General ledger, invoicing, financial reports

## Quick Start

### 1. Project Setup

```bash
# Create new Electron project
mkdir pos-accounting-app && cd pos-accounting-app
npm init -y

# Install Electron and essential dependencies
npm install electron electron-builder --save-dev
npm install better-sqlite3 electron-store uuid dayjs

# Install UI framework (choose one)
npm install react react-dom @vitejs/plugin-react vite --save-dev
# OR
npm install vue @vitejs/plugin-vue vite --save-dev
```

### 2. Project Structure

```
pos-accounting-app/
├── package.json
├── electron/
│   ├── main.js              # Electron main process
│   ├── preload.js           # Preload script for IPC
│   └── database/
│       ├── db.js            # SQLite connection
│       ├── migrations/      # Database migrations
│       └── models/          # Data models
├── src/
│   ├── main.jsx             # React/Vue entry
│   ├── App.jsx              # Main app component
│   ├── components/
│   │   ├── pos/             # POS components
│   │   ├── inventory/       # Inventory components
│   │   └── accounting/      # Accounting components
│   ├── pages/
│   ├── stores/              # State management
│   └── utils/
├── public/
└── dist/                    # Built output
```

## Using Context7 MCP for Documentation

**IMPORTANT**: Always use Context7 MCP to fetch up-to-date documentation before implementing features:

```
# First, resolve the library ID
mcp__context7__resolve-library-id("electron")
mcp__context7__resolve-library-id("better-sqlite3")

# Then fetch documentation
mcp__context7__get-library-docs("/npm/electron", topic="ipc-main")
mcp__context7__get-library-docs("/npm/better-sqlite3", topic="transactions")
```

### Key Libraries to Look Up

| Library | Use Case |
|---------|----------|
| `electron` | Desktop app framework |
| `better-sqlite3` | SQLite database |
| `electron-builder` | App packaging |
| `electron-store` | Persistent config storage |
| `dayjs` | Date manipulation |
| `uuid` | Generate unique IDs |
| `pdfmake` | Generate PDF receipts/invoices |
| `escpos` | Thermal receipt printing |

## Core Features Implementation

### Database Connection (better-sqlite3)

```javascript
// electron/database/db.js
const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

const dbPath = path.join(app.getPath('userData'), 'pos-accounting.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
```

### IPC Communication Pattern

```javascript
// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // POS
  createSale: (saleData) => ipcRenderer.invoke('pos:create-sale', saleData),
  getSales: (filters) => ipcRenderer.invoke('pos:get-sales', filters),

  // Inventory
  getProducts: () => ipcRenderer.invoke('inventory:get-products'),
  updateStock: (productId, quantity) => ipcRenderer.invoke('inventory:update-stock', productId, quantity),

  // Accounting
  createInvoice: (invoiceData) => ipcRenderer.invoke('accounting:create-invoice', invoiceData),
  getAccountBalance: (accountId) => ipcRenderer.invoke('accounting:get-balance', accountId),
});
```

```javascript
// electron/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const { createSale, getSales } = require('./database/models/sales');

ipcMain.handle('pos:create-sale', async (event, saleData) => {
  return createSale(saleData);
});

ipcMain.handle('pos:get-sales', async (event, filters) => {
  return getSales(filters);
});
```

## Module Documentation

For detailed implementation guides, refer to:

- [DATABASE.md](DATABASE.md) - Complete SQLite schema and migrations
- [POS.md](POS.md) - Point of Sales implementation
- [INVENTORY.md](INVENTORY.md) - Inventory management system
- [ACCOUNTING.md](ACCOUNTING.md) - Accounting and financial reports
- [ELECTRON-SETUP.md](ELECTRON-SETUP.md) - Electron configuration and packaging

## Best Practices

### Database

1. **Use transactions** for multi-table operations
2. **Create indexes** on frequently queried columns
3. **Implement soft deletes** for audit trails
4. **Use prepared statements** to prevent SQL injection
5. **Backup database** regularly

### Electron Security

1. **Disable nodeIntegration** in renderer
2. **Enable contextIsolation**
3. **Use preload scripts** for IPC
4. **Validate all IPC inputs**
5. **Don't expose sensitive APIs** to renderer

### Application Architecture

1. **Separate concerns**: Keep database logic in main process
2. **Use state management**: Pinia (Vue) or Zustand (React)
3. **Implement error handling**: Graceful error messages
4. **Add logging**: Track important operations
5. **Design for offline**: SQLite works offline by default

## Common Commands

```bash
# Development
npm run dev            # Start in development mode

# Build
npm run build          # Build for production
npm run dist           # Package for distribution

# Database
npm run migrate        # Run migrations
npm run seed           # Seed sample data
npm run backup         # Backup database
```

## Sample package.json Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "build": "vite build",
    "dist": "npm run build && electron-builder",
    "migrate": "node electron/database/migrate.js",
    "seed": "node electron/database/seed.js"
  },
  "main": "electron/main.js",
  "build": {
    "appId": "com.yourcompany.pos-accounting",
    "productName": "POS Accounting",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
    "win": {
      "target": "nsis"
    },
    "linux": {
      "target": "AppImage"
    },
    "mac": {
      "target": "dmg"
    }
  }
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| SQLite native module error | Rebuild: `npm rebuild better-sqlite3` |
| White screen in production | Check paths in `BrowserWindow.loadFile()` |
| IPC not working | Verify preload script path and contextIsolation |
| Printer not found | Check USB permissions on Linux |

## Requirements

- Node.js 18+
- npm or yarn
- For native modules: Python 3, node-gyp, C++ build tools
