# Electron.js Setup & Configuration

## Overview

This document provides comprehensive setup instructions for the Electron.js application, including main process configuration, security settings, auto-updates, and packaging.

## Project Initialization

### 1. Initialize Project

```bash
# Create project directory
mkdir pos-accounting-app && cd pos-accounting-app

# Initialize npm
npm init -y

# Install core dependencies
npm install electron better-sqlite3 electron-store uuid dayjs --save
npm install electron-builder concurrently wait-on --save-dev

# Install UI framework (React + Vite)
npm install react react-dom react-router-dom zustand --save
npm install @vitejs/plugin-react vite --save-dev

# Optional: Install additional utilities
npm install lodash pdfmake electron-updater --save
```

### 2. Project Structure

```
pos-accounting-app/
├── package.json
├── vite.config.js
├── electron/
│   ├── main.js              # Main process entry
│   ├── preload.js           # Preload script
│   ├── database/
│   │   ├── db.js            # Database connection
│   │   ├── migrate.js       # Migration runner
│   │   ├── migrations/      # SQL migration files
│   │   └── models/          # Data models
│   ├── ipc/
│   │   ├── index.js         # IPC handler registration
│   │   ├── posHandlers.js
│   │   ├── inventoryHandlers.js
│   │   └── accountingHandlers.js
│   └── services/
│       ├── printer.js       # Printing service
│       ├── backup.js        # Backup service
│       └── updater.js       # Auto-update service
├── src/
│   ├── main.jsx             # React entry point
│   ├── App.jsx              # Root component
│   ├── index.css            # Global styles
│   ├── components/
│   ├── pages/
│   ├── stores/              # Zustand stores
│   └── utils/
├── public/
│   └── icon.png             # App icon
└── dist/                    # Build output
```

## Main Process Configuration

### electron/main.js

```javascript
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const isDev = !app.isPackaged;

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) app.quit();

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, '../public/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false // Required for better-sqlite3
    },
    show: false, // Don't show until ready
    backgroundColor: '#1a1a2e'
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Cleanup
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Set up application menu
  setupMenu();
}

function setupMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Backup Database',
          click: () => mainWindow.webContents.send('menu:backup')
        },
        {
          label: 'Restore Database',
          click: () => mainWindow.webContents.send('menu:restore')
        },
        { type: 'separator' },
        {
          label: 'Print',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow.webContents.send('menu:print')
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: 'POS Accounting System',
              detail: `Version: ${app.getVersion()}\nElectron: ${process.versions.electron}\nNode: ${process.versions.node}`
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Initialize database and IPC handlers
function initializeApp() {
  // Initialize database
  require('./database/db');

  // Register IPC handlers
  require('./ipc');
}

// App lifecycle
app.whenReady().then(() => {
  initializeApp();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event) => {
    event.preventDefault();
  });
});
```

### electron/preload.js

```javascript
const { contextBridge, ipcRenderer } = require('electron');

// Whitelist of valid IPC channels
const validChannels = {
  invoke: [
    // POS
    'pos:create-sale',
    'pos:get-sales',
    'pos:get-sale',
    'pos:void-sale',
    'pos:search-products',
    'pos:find-by-barcode',
    'pos:print-receipt',
    'pos:open-drawer',
    'pos:daily-summary',

    // Inventory
    'inventory:get-products',
    'inventory:get-product',
    'inventory:create-product',
    'inventory:update-product',
    'inventory:delete-product',
    'inventory:adjust-stock',
    'inventory:get-low-stock',
    'inventory:get-categories',
    'inventory:create-category',
    'inventory:get-suppliers',
    'inventory:create-supplier',
    'inventory:update-supplier',
    'inventory:get-purchase-orders',
    'inventory:get-purchase-order',
    'inventory:create-purchase-order',
    'inventory:receive-purchase-order',

    // Accounting
    'accounting:get-accounts',
    'accounting:create-account',
    'accounting:get-journal-entries',
    'accounting:create-journal-entry',
    'accounting:post-journal-entry',
    'accounting:get-invoices',
    'accounting:get-invoice',
    'accounting:create-invoice',
    'accounting:record-payment',
    'accounting:get-bills',
    'accounting:create-bill',
    'accounting:pay-bill',

    // Reports
    'reports:trial-balance',
    'reports:income-statement',
    'reports:balance-sheet',
    'reports:receivable-aging',
    'reports:payable-aging',
    'reports:sales-summary',
    'reports:stock-valuation',
    'reports:stock-movement',

    // Customers
    'customers:get-all',
    'customers:get',
    'customers:create',
    'customers:update',
    'customers:delete',

    // Users
    'users:login',
    'users:logout',
    'users:get-current',
    'users:get-all',
    'users:create',
    'users:update',

    // Settings
    'settings:get',
    'settings:set',
    'settings:get-all',

    // System
    'system:backup',
    'system:restore',
    'system:get-stats',
    'system:check-updates',
    'system:install-update'
  ],
  on: [
    'menu:backup',
    'menu:restore',
    'menu:print',
    'update:available',
    'update:downloaded',
    'update:progress'
  ]
};

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('api', {
  // Invoke methods (request-response)
  invoke: (channel, ...args) => {
    if (validChannels.invoke.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invalid channel: ${channel}`);
  },

  // Event listeners
  on: (channel, callback) => {
    if (validChannels.on.includes(channel)) {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
    throw new Error(`Invalid channel: ${channel}`);
  },

  // Convenience methods
  // POS
  createSale: (data) => ipcRenderer.invoke('pos:create-sale', data),
  getSales: (filters) => ipcRenderer.invoke('pos:get-sales', filters),
  getSale: (id) => ipcRenderer.invoke('pos:get-sale', id),
  voidSale: (id, userId) => ipcRenderer.invoke('pos:void-sale', { id, userId }),
  searchProducts: (options) => ipcRenderer.invoke('pos:search-products', options),
  findProductByBarcode: (barcode) => ipcRenderer.invoke('pos:find-by-barcode', barcode),
  printReceipt: (saleId) => ipcRenderer.invoke('pos:print-receipt', saleId),
  openCashDrawer: () => ipcRenderer.invoke('pos:open-drawer'),
  getDailySummary: (date) => ipcRenderer.invoke('pos:daily-summary', date),

  // Inventory
  getProducts: (options) => ipcRenderer.invoke('inventory:get-products', options),
  getProduct: (id) => ipcRenderer.invoke('inventory:get-product', id),
  createProduct: (data) => ipcRenderer.invoke('inventory:create-product', data),
  updateProduct: (id, data) => ipcRenderer.invoke('inventory:update-product', id, data),
  adjustStock: (data) => ipcRenderer.invoke('inventory:adjust-stock', data),
  getLowStock: () => ipcRenderer.invoke('inventory:get-low-stock'),
  getCategories: () => ipcRenderer.invoke('inventory:get-categories'),
  createCategory: (data) => ipcRenderer.invoke('inventory:create-category', data),
  getSuppliers: (options) => ipcRenderer.invoke('inventory:get-suppliers', options),
  createSupplier: (data) => ipcRenderer.invoke('inventory:create-supplier', data),
  updateSupplier: (id, data) => ipcRenderer.invoke('inventory:update-supplier', id, data),
  getPurchaseOrders: (filters) => ipcRenderer.invoke('inventory:get-purchase-orders', filters),
  getPurchaseOrder: (id) => ipcRenderer.invoke('inventory:get-purchase-order', id),
  createPurchaseOrder: (data) => ipcRenderer.invoke('inventory:create-purchase-order', data),
  receivePurchaseOrder: (id, items) => ipcRenderer.invoke('inventory:receive-purchase-order', id, items),

  // Accounting
  getAccounts: () => ipcRenderer.invoke('accounting:get-accounts'),
  createAccount: (data) => ipcRenderer.invoke('accounting:create-account', data),
  getInvoices: (filters) => ipcRenderer.invoke('accounting:get-invoices', filters),
  getInvoice: (id) => ipcRenderer.invoke('accounting:get-invoice', id),
  createInvoice: (data) => ipcRenderer.invoke('accounting:create-invoice', data),
  recordPayment: (invoiceId, data) => ipcRenderer.invoke('accounting:record-payment', invoiceId, data),

  // Reports
  getTrialBalance: (date) => ipcRenderer.invoke('reports:trial-balance', date),
  getIncomeStatement: (start, end) => ipcRenderer.invoke('reports:income-statement', start, end),
  getBalanceSheet: (date) => ipcRenderer.invoke('reports:balance-sheet', date),
  getReceivableAging: () => ipcRenderer.invoke('reports:receivable-aging'),
  getSalesSummary: (start, end, groupBy) => ipcRenderer.invoke('reports:sales-summary', start, end, groupBy),

  // Customers
  getCustomers: (options) => ipcRenderer.invoke('customers:get-all', options),
  getCustomer: (id) => ipcRenderer.invoke('customers:get', id),
  createCustomer: (data) => ipcRenderer.invoke('customers:create', data),
  updateCustomer: (id, data) => ipcRenderer.invoke('customers:update', id, data),

  // Users
  login: (username, password) => ipcRenderer.invoke('users:login', username, password),
  logout: () => ipcRenderer.invoke('users:logout'),
  getCurrentUser: () => ipcRenderer.invoke('users:get-current'),

  // Settings
  getSetting: (key) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  getAllSettings: () => ipcRenderer.invoke('settings:get-all'),

  // System
  backupDatabase: () => ipcRenderer.invoke('system:backup'),
  restoreDatabase: (path) => ipcRenderer.invoke('system:restore', path),
  checkForUpdates: () => ipcRenderer.invoke('system:check-updates')
});

// Expose platform info
contextBridge.exposeInMainWorld('platform', {
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux'
});
```

## Vite Configuration

### vite.config.js

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './', // Important for Electron
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
```

## Package.json Configuration

```json
{
  "name": "pos-accounting-app",
  "version": "1.0.0",
  "description": "Point of Sales, Inventory & Accounting System",
  "main": "electron/main.js",
  "scripts": {
    "dev": "concurrently \"npm run dev:vite\" \"npm run dev:electron\"",
    "dev:vite": "vite",
    "dev:electron": "wait-on http://localhost:5173 && electron .",
    "build": "vite build",
    "preview": "vite preview",
    "electron": "electron .",
    "dist": "npm run build && electron-builder",
    "dist:win": "npm run build && electron-builder --win",
    "dist:mac": "npm run build && electron-builder --mac",
    "dist:linux": "npm run build && electron-builder --linux",
    "rebuild": "electron-rebuild -f -w better-sqlite3",
    "postinstall": "electron-builder install-app-deps",
    "migrate": "node electron/database/migrate.js",
    "seed": "node electron/database/seed.js"
  },
  "build": {
    "appId": "com.yourcompany.pos-accounting",
    "productName": "POS Accounting",
    "copyright": "Copyright © 2024 Your Company",
    "directories": {
      "output": "release",
      "buildResources": "build"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "!electron/database/migrations/*.sql",
      "node_modules/**/*"
    ],
    "extraResources": [
      {
        "from": "electron/database/migrations",
        "to": "migrations"
      }
    ],
    "asar": true,
    "asarUnpack": [
      "node_modules/better-sqlite3/**/*"
    ],
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        }
      ],
      "icon": "build/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "perMachine": true,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    },
    "mac": {
      "target": ["dmg", "zip"],
      "icon": "build/icon.icns",
      "category": "public.app-category.business"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "build/icons",
      "category": "Office"
    },
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "pos-accounting-app"
    }
  },
  "dependencies": {
    "better-sqlite3": "^9.0.0",
    "dayjs": "^1.11.10",
    "electron-store": "^8.1.0",
    "electron-updater": "^6.1.0",
    "lodash": "^4.17.21",
    "pdfmake": "^0.2.8",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "uuid": "^9.0.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "concurrently": "^8.2.0",
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0",
    "electron-rebuild": "^3.2.9",
    "vite": "^5.0.0",
    "wait-on": "^7.2.0"
  }
}
```

## Auto-Update Configuration

### electron/services/updater.js

```javascript
const { autoUpdater } = require('electron-updater');
const { app, BrowserWindow, ipcMain } = require('electron');
const log = require('electron-log');

class AppUpdater {
  constructor() {
    autoUpdater.logger = log;
    autoUpdater.logger.transports.file.level = 'info';
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    this.setupEventListeners();
    this.setupIpcHandlers();
  }

  setupEventListeners() {
    autoUpdater.on('checking-for-update', () => {
      this.sendStatusToWindow('checking-for-update');
    });

    autoUpdater.on('update-available', (info) => {
      this.sendStatusToWindow('update-available', info);
    });

    autoUpdater.on('update-not-available', (info) => {
      this.sendStatusToWindow('update-not-available', info);
    });

    autoUpdater.on('error', (err) => {
      this.sendStatusToWindow('error', err.message);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      this.sendStatusToWindow('download-progress', progressObj);
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.sendStatusToWindow('update-downloaded', info);
    });
  }

  setupIpcHandlers() {
    ipcMain.handle('system:check-updates', async () => {
      try {
        const result = await autoUpdater.checkForUpdates();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('system:download-update', async () => {
      try {
        await autoUpdater.downloadUpdate();
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('system:install-update', () => {
      autoUpdater.quitAndInstall(false, true);
    });
  }

  sendStatusToWindow(status, data = null) {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      win.webContents.send('update:status', { status, data });
    }
  }

  checkForUpdates() {
    if (!app.isPackaged) {
      console.log('Skipping update check in development');
      return;
    }
    autoUpdater.checkForUpdates();
  }
}

module.exports = new AppUpdater();
```

## Tab-Based Settings Page

### src/pages/Settings.jsx

```jsx
import React, { useState, useEffect } from 'react';

const TABS = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'company', label: 'Company', icon: '🏢' },
  { id: 'pos', label: 'POS', icon: '🛒' },
  { id: 'inventory', label: 'Inventory', icon: '📦' },
  { id: 'accounting', label: 'Accounting', icon: '📊' },
  { id: 'printer', label: 'Printer', icon: '🖨️' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'backup', label: 'Backup', icon: '💾' }
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const result = await window.api.getAllSettings();
      setSettings(result.data || {});
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key, value) => {
    setSaving(true);
    try {
      await window.api.setSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      alert(`Error saving setting: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="loading">Loading settings...</div>;

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>Settings</h2>
      </div>

      <div className="settings-container">
        {/* Tab Navigation */}
        <div className="settings-tabs">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="settings-content">
          {activeTab === 'general' && (
            <GeneralSettings settings={settings} onUpdate={updateSetting} onSave={handleSave} />
          )}
          {activeTab === 'company' && (
            <CompanySettings settings={settings} onUpdate={updateSetting} onSave={handleSave} />
          )}
          {activeTab === 'pos' && (
            <POSSettings settings={settings} onUpdate={updateSetting} onSave={handleSave} />
          )}
          {activeTab === 'inventory' && (
            <InventorySettings settings={settings} onUpdate={updateSetting} onSave={handleSave} />
          )}
          {activeTab === 'accounting' && (
            <AccountingSettings settings={settings} onUpdate={updateSetting} onSave={handleSave} />
          )}
          {activeTab === 'printer' && (
            <PrinterSettings settings={settings} onUpdate={updateSetting} onSave={handleSave} />
          )}
          {activeTab === 'users' && (
            <UsersSettings />
          )}
          {activeTab === 'backup' && (
            <BackupSettings />
          )}
        </div>
      </div>
    </div>
  );
};

// General Settings Tab
const GeneralSettings = ({ settings, onUpdate, onSave }) => (
  <div className="tab-panel">
    <h3>General Settings</h3>

    <div className="setting-group">
      <label>Application Language</label>
      <select
        value={settings.language || 'en'}
        onChange={(e) => {
          onUpdate('language', e.target.value);
          onSave('language', e.target.value);
        }}
      >
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="ar">Arabic</option>
      </select>
    </div>

    <div className="setting-group">
      <label>Date Format</label>
      <select
        value={settings.date_format || 'YYYY-MM-DD'}
        onChange={(e) => {
          onUpdate('date_format', e.target.value);
          onSave('date_format', e.target.value);
        }}
      >
        <option value="YYYY-MM-DD">2024-01-15</option>
        <option value="DD/MM/YYYY">15/01/2024</option>
        <option value="MM/DD/YYYY">01/15/2024</option>
        <option value="DD-MMM-YYYY">15-Jan-2024</option>
      </select>
    </div>

    <div className="setting-group">
      <label>Currency Symbol</label>
      <input
        type="text"
        value={settings.currency_symbol || '$'}
        onChange={(e) => onUpdate('currency_symbol', e.target.value)}
        onBlur={(e) => onSave('currency_symbol', e.target.value)}
      />
    </div>

    <div className="setting-group">
      <label>
        <input
          type="checkbox"
          checked={settings.dark_mode === 'true'}
          onChange={(e) => {
            onUpdate('dark_mode', e.target.checked.toString());
            onSave('dark_mode', e.target.checked.toString());
          }}
        />
        Enable Dark Mode
      </label>
    </div>
  </div>
);

// Company Settings Tab
const CompanySettings = ({ settings, onUpdate, onSave }) => (
  <div className="tab-panel">
    <h3>Company Information</h3>

    <div className="setting-group">
      <label>Company Name</label>
      <input
        type="text"
        value={settings.company_name || ''}
        onChange={(e) => onUpdate('company_name', e.target.value)}
        onBlur={(e) => onSave('company_name', e.target.value)}
      />
    </div>

    <div className="setting-group">
      <label>Address</label>
      <textarea
        value={settings.company_address || ''}
        onChange={(e) => onUpdate('company_address', e.target.value)}
        onBlur={(e) => onSave('company_address', e.target.value)}
        rows="3"
      />
    </div>

    <div className="setting-row">
      <div className="setting-group">
        <label>Phone</label>
        <input
          type="text"
          value={settings.company_phone || ''}
          onChange={(e) => onUpdate('company_phone', e.target.value)}
          onBlur={(e) => onSave('company_phone', e.target.value)}
        />
      </div>

      <div className="setting-group">
        <label>Email</label>
        <input
          type="email"
          value={settings.company_email || ''}
          onChange={(e) => onUpdate('company_email', e.target.value)}
          onBlur={(e) => onSave('company_email', e.target.value)}
        />
      </div>
    </div>

    <div className="setting-group">
      <label>Tax ID / Registration Number</label>
      <input
        type="text"
        value={settings.tax_id || ''}
        onChange={(e) => onUpdate('tax_id', e.target.value)}
        onBlur={(e) => onSave('tax_id', e.target.value)}
      />
    </div>

    <div className="setting-group">
      <label>Website</label>
      <input
        type="url"
        value={settings.company_website || ''}
        onChange={(e) => onUpdate('company_website', e.target.value)}
        onBlur={(e) => onSave('company_website', e.target.value)}
      />
    </div>
  </div>
);

// POS Settings Tab
const POSSettings = ({ settings, onUpdate, onSave }) => (
  <div className="tab-panel">
    <h3>Point of Sales Settings</h3>

    <div className="setting-group">
      <label>Invoice Prefix</label>
      <input
        type="text"
        value={settings.invoice_prefix || 'INV'}
        onChange={(e) => onUpdate('invoice_prefix', e.target.value)}
        onBlur={(e) => onSave('invoice_prefix', e.target.value)}
      />
    </div>

    <div className="setting-group">
      <label>Default Tax Rate (%)</label>
      <input
        type="number"
        step="0.01"
        value={settings.default_tax_rate || '0'}
        onChange={(e) => onUpdate('default_tax_rate', e.target.value)}
        onBlur={(e) => onSave('default_tax_rate', e.target.value)}
      />
    </div>

    <div className="setting-group">
      <label>
        <input
          type="checkbox"
          checked={settings.auto_print_receipt === 'true'}
          onChange={(e) => {
            onUpdate('auto_print_receipt', e.target.checked.toString());
            onSave('auto_print_receipt', e.target.checked.toString());
          }}
        />
        Auto Print Receipt After Sale
      </label>
    </div>

    <div className="setting-group">
      <label>
        <input
          type="checkbox"
          checked={settings.open_cash_drawer === 'true'}
          onChange={(e) => {
            onUpdate('open_cash_drawer', e.target.checked.toString());
            onSave('open_cash_drawer', e.target.checked.toString());
          }}
        />
        Open Cash Drawer After Sale
      </label>
    </div>

    <div className="setting-group">
      <label>
        <input
          type="checkbox"
          checked={settings.allow_negative_stock === 'true'}
          onChange={(e) => {
            onUpdate('allow_negative_stock', e.target.checked.toString());
            onSave('allow_negative_stock', e.target.checked.toString());
          }}
        />
        Allow Negative Stock (Sell Without Inventory)
      </label>
    </div>

    <div className="setting-group">
      <label>Receipt Footer Text</label>
      <textarea
        value={settings.receipt_footer || ''}
        onChange={(e) => onUpdate('receipt_footer', e.target.value)}
        onBlur={(e) => onSave('receipt_footer', e.target.value)}
        rows="3"
        placeholder="Thank you for your purchase!"
      />
    </div>
  </div>
);

// Inventory Settings Tab
const InventorySettings = ({ settings, onUpdate, onSave }) => (
  <div className="tab-panel">
    <h3>Inventory Settings</h3>

    <div className="setting-group">
      <label>Default Low Stock Alert Threshold</label>
      <input
        type="number"
        value={settings.default_low_stock || '10'}
        onChange={(e) => onUpdate('default_low_stock', e.target.value)}
        onBlur={(e) => onSave('default_low_stock', e.target.value)}
      />
    </div>

    <div className="setting-group">
      <label>
        <input
          type="checkbox"
          checked={settings.track_expiry_dates === 'true'}
          onChange={(e) => {
            onUpdate('track_expiry_dates', e.target.checked.toString());
            onSave('track_expiry_dates', e.target.checked.toString());
          }}
        />
        Track Product Expiry Dates
      </label>
    </div>

    <div className="setting-group">
      <label>
        <input
          type="checkbox"
          checked={settings.enable_barcode_generation === 'true'}
          onChange={(e) => {
            onUpdate('enable_barcode_generation', e.target.checked.toString());
            onSave('enable_barcode_generation', e.target.checked.toString());
          }}
        />
        Auto-Generate Barcodes for New Products
      </label>
    </div>

    <div className="setting-group">
      <label>SKU Prefix</label>
      <input
        type="text"
        value={settings.sku_prefix || 'SKU'}
        onChange={(e) => onUpdate('sku_prefix', e.target.value)}
        onBlur={(e) => onSave('sku_prefix', e.target.value)}
      />
    </div>
  </div>
);

// Accounting Settings Tab
const AccountingSettings = ({ settings, onUpdate, onSave }) => (
  <div className="tab-panel">
    <h3>Accounting Settings</h3>

    <div className="setting-group">
      <label>Fiscal Year Start</label>
      <select
        value={settings.fiscal_year_start || '01'}
        onChange={(e) => {
          onUpdate('fiscal_year_start', e.target.value);
          onSave('fiscal_year_start', e.target.value);
        }}
      >
        {Array.from({ length: 12 }, (_, i) => {
          const month = String(i + 1).padStart(2, '0');
          const name = new Date(2000, i).toLocaleString('default', { month: 'long' });
          return <option key={month} value={month}>{name}</option>;
        })}
      </select>
    </div>

    <div className="setting-group">
      <label>Default Payment Terms (Days)</label>
      <input
        type="number"
        value={settings.default_payment_terms || '30'}
        onChange={(e) => onUpdate('default_payment_terms', e.target.value)}
        onBlur={(e) => onSave('default_payment_terms', e.target.value)}
      />
    </div>

    <div className="setting-group">
      <label>
        <input
          type="checkbox"
          checked={settings.auto_post_entries === 'true'}
          onChange={(e) => {
            onUpdate('auto_post_entries', e.target.checked.toString());
            onSave('auto_post_entries', e.target.checked.toString());
          }}
        />
        Auto-Post Journal Entries
      </label>
    </div>
  </div>
);

// Printer Settings Tab
const PrinterSettings = ({ settings, onUpdate, onSave }) => {
  const [printers, setPrinters] = useState([]);

  useEffect(() => {
    // In Electron, you can get printers via webContents.getPrintersAsync()
    // This would need IPC implementation
  }, []);

  return (
    <div className="tab-panel">
      <h3>Printer Settings</h3>

      <div className="setting-group">
        <label>Receipt Printer Type</label>
        <select
          value={settings.receipt_printer_type || 'thermal'}
          onChange={(e) => {
            onUpdate('receipt_printer_type', e.target.value);
            onSave('receipt_printer_type', e.target.value);
          }}
        >
          <option value="thermal">Thermal (80mm)</option>
          <option value="thermal58">Thermal (58mm)</option>
          <option value="standard">Standard Printer</option>
          <option value="pdf">PDF Only</option>
        </select>
      </div>

      <div className="setting-group">
        <label>Paper Width (mm)</label>
        <input
          type="number"
          value={settings.paper_width || '80'}
          onChange={(e) => onUpdate('paper_width', e.target.value)}
          onBlur={(e) => onSave('paper_width', e.target.value)}
        />
      </div>

      <div className="setting-group">
        <button className="btn-secondary" onClick={() => {/* Test print */}}>
          Print Test Page
        </button>
      </div>
    </div>
  );
};

// Users Settings Tab
const UsersSettings = () => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const result = await window.api.invoke('users:get-all');
    if (result.success) setUsers(result.data);
  };

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <h3>User Management</h3>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Add User
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Full Name</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.full_name}</td>
              <td>{user.role}</td>
              <td>
                <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <button>Edit</button>
                <button>Reset Password</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Backup Settings Tab
const BackupSettings = () => {
  const [backups, setBackups] = useState([]);
  const [backing, setBacking] = useState(false);

  const handleBackup = async () => {
    setBacking(true);
    try {
      const result = await window.api.backupDatabase();
      if (result.success) {
        alert(`Backup created: ${result.data}`);
      } else {
        alert(`Backup failed: ${result.error}`);
      }
    } finally {
      setBacking(false);
    }
  };

  return (
    <div className="tab-panel">
      <h3>Backup & Restore</h3>

      <div className="backup-actions">
        <button
          className="btn-primary"
          onClick={handleBackup}
          disabled={backing}
        >
          {backing ? 'Creating Backup...' : 'Create Backup Now'}
        </button>

        <button className="btn-secondary">
          Restore from Backup
        </button>
      </div>

      <div className="setting-group">
        <label>
          <input type="checkbox" />
          Enable Auto-Backup
        </label>
      </div>

      <div className="setting-group">
        <label>Auto-Backup Frequency</label>
        <select>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div className="backup-list">
        <h4>Recent Backups</h4>
        {backups.length === 0 ? (
          <p>No backups found</p>
        ) : (
          <ul>
            {backups.map((backup, index) => (
              <li key={index}>
                <span>{backup.name}</span>
                <span>{backup.date}</span>
                <button>Restore</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Settings;
```

### Settings CSS

```css
/* src/styles/settings.css */

.settings-page {
  padding: 1rem;
  height: 100%;
}

.settings-container {
  display: flex;
  gap: 1rem;
  height: calc(100% - 60px);
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.settings-tabs {
  width: 200px;
  background: #f5f5f5;
  padding: 1rem 0;
  border-right: 1px solid #e0e0e0;
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
}

.tab-button:hover {
  background: #e0e0e0;
}

.tab-button.active {
  background: white;
  border-right: 3px solid #4a90d9;
  font-weight: 600;
}

.tab-icon {
  font-size: 1.2rem;
}

.settings-content {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.tab-panel h3 {
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.setting-group {
  margin-bottom: 1.25rem;
}

.setting-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.setting-group input[type="text"],
.setting-group input[type="email"],
.setting-group input[type="url"],
.setting-group input[type="number"],
.setting-group select,
.setting-group textarea {
  width: 100%;
  max-width: 400px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
}

.setting-group input[type="checkbox"] {
  margin-right: 0.5rem;
}

.setting-row {
  display: flex;
  gap: 1rem;
}

.setting-row .setting-group {
  flex: 1;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.backup-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.backup-list {
  margin-top: 2rem;
}

.backup-list h4 {
  margin-bottom: 1rem;
}

.backup-list ul {
  list-style: none;
  padding: 0;
}

.backup-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}
```

## Running & Building

```bash
# Development
npm run dev

# Build for production
npm run dist

# Build for specific platform
npm run dist:win
npm run dist:mac
npm run dist:linux
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `better-sqlite3` build error | Run `npm run rebuild` |
| White screen in production | Check `base: './'` in vite.config.js |
| IPC errors | Verify channel is in whitelist in preload.js |
| App not starting | Check console for errors with `electron --inspect .` |
| Native module error | Ensure electron-builder dependencies are installed |
