# Accounting Module

## Overview

The Accounting module provides comprehensive financial management including chart of accounts, journal entries, invoicing, bills, payments, and financial reports following double-entry accounting principles.

## Key Features

- Chart of Accounts management
- Double-entry journal entries
- Accounts Receivable (Customer Invoices)
- Accounts Payable (Supplier Bills)
- Payment processing
- Financial reports (Income Statement, Balance Sheet, Trial Balance)
- Multi-currency support (optional)

## Chart of Accounts Setup

### Default Account Structure

```javascript
// electron/database/seed/accounts.js
const defaultAccounts = [
  // Assets (1xxx)
  { code: '1000', name: 'Assets', type: 'asset', isSystem: true },
  { code: '1100', name: 'Cash', type: 'asset', parent: '1000' },
  { code: '1110', name: 'Cash on Hand', type: 'asset', parent: '1100' },
  { code: '1120', name: 'Bank Account', type: 'asset', parent: '1100' },
  { code: '1200', name: 'Accounts Receivable', type: 'asset', parent: '1000', isSystem: true },
  { code: '1300', name: 'Inventory', type: 'asset', parent: '1000', isSystem: true },
  { code: '1400', name: 'Prepaid Expenses', type: 'asset', parent: '1000' },
  { code: '1500', name: 'Fixed Assets', type: 'asset', parent: '1000' },
  { code: '1510', name: 'Equipment', type: 'asset', parent: '1500' },
  { code: '1520', name: 'Accumulated Depreciation', type: 'asset', parent: '1500' },

  // Liabilities (2xxx)
  { code: '2000', name: 'Liabilities', type: 'liability', isSystem: true },
  { code: '2100', name: 'Accounts Payable', type: 'liability', parent: '2000', isSystem: true },
  { code: '2200', name: 'Accrued Expenses', type: 'liability', parent: '2000' },
  { code: '2300', name: 'Sales Tax Payable', type: 'liability', parent: '2000', isSystem: true },
  { code: '2400', name: 'Short-term Loans', type: 'liability', parent: '2000' },
  { code: '2500', name: 'Long-term Liabilities', type: 'liability', parent: '2000' },

  // Equity (3xxx)
  { code: '3000', name: 'Equity', type: 'equity', isSystem: true },
  { code: '3100', name: 'Owner\'s Capital', type: 'equity', parent: '3000' },
  { code: '3200', name: 'Retained Earnings', type: 'equity', parent: '3000', isSystem: true },
  { code: '3300', name: 'Owner\'s Drawings', type: 'equity', parent: '3000' },

  // Income (4xxx)
  { code: '4000', name: 'Income', type: 'income', isSystem: true },
  { code: '4100', name: 'Sales Revenue', type: 'income', parent: '4000', isSystem: true },
  { code: '4200', name: 'Service Revenue', type: 'income', parent: '4000' },
  { code: '4300', name: 'Other Income', type: 'income', parent: '4000' },
  { code: '4310', name: 'Interest Income', type: 'income', parent: '4300' },
  { code: '4320', name: 'Discount Received', type: 'income', parent: '4300' },

  // Expenses (5xxx)
  { code: '5000', name: 'Cost of Goods Sold', type: 'expense', parent: null, isSystem: true },

  // Operating Expenses (6xxx)
  { code: '6000', name: 'Operating Expenses', type: 'expense', isSystem: true },
  { code: '6100', name: 'Salaries & Wages', type: 'expense', parent: '6000' },
  { code: '6200', name: 'Rent Expense', type: 'expense', parent: '6000' },
  { code: '6300', name: 'Utilities', type: 'expense', parent: '6000' },
  { code: '6400', name: 'Office Supplies', type: 'expense', parent: '6000' },
  { code: '6500', name: 'Marketing & Advertising', type: 'expense', parent: '6000' },
  { code: '6600', name: 'Insurance', type: 'expense', parent: '6000' },
  { code: '6700', name: 'Depreciation', type: 'expense', parent: '6000' },
  { code: '6800', name: 'Bank Charges', type: 'expense', parent: '6000' },
  { code: '6900', name: 'Miscellaneous Expenses', type: 'expense', parent: '6000' }
];
```

## Accounting Models

### Journal Entry Model

```javascript
// electron/database/models/journalEntry.js
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const JournalEntryModel = {
  generateEntryNumber() {
    const year = new Date().getFullYear();
    const count = db.db.prepare(`
      SELECT COUNT(*) as count FROM journal_entries
      WHERE strftime('%Y', created_at) = ?
    `).get(year.toString()).count;

    return `JE-${year}-${String(count + 1).padStart(5, '0')}`;
  },

  create(data) {
    return db.db.transaction(() => {
      // Validate debit = credit
      const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
      const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error('Debits and credits must be equal');
      }

      const entryId = uuidv4();
      const entryNumber = this.generateEntryNumber();

      // Insert journal entry
      db.db.prepare(`
        INSERT INTO journal_entries (id, entry_number, entry_date, description, reference_type, reference_id, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(entryId, entryNumber, data.entryDate, data.description, data.referenceType, data.referenceId, data.userId);

      // Insert lines
      const insertLine = db.db.prepare(`
        INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const line of data.lines) {
        insertLine.run(uuidv4(), entryId, line.accountId, line.debit || 0, line.credit || 0, line.description);
      }

      return this.findById(entryId);
    })();
  },

  post(id) {
    return db.db.transaction(() => {
      const entry = this.findById(id);
      if (!entry) throw new Error('Journal entry not found');
      if (entry.is_posted) throw new Error('Entry already posted');

      // Update account balances
      const updateBalance = db.db.prepare(`
        UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?
      `);

      for (const line of entry.lines) {
        // For asset/expense: debit increases, credit decreases
        // For liability/equity/income: credit increases, debit decreases
        const account = db.db.prepare('SELECT account_type FROM accounts WHERE id = ?').get(line.account_id);
        let amount;

        if (['asset', 'expense'].includes(account.account_type)) {
          amount = line.debit - line.credit;
        } else {
          amount = line.credit - line.debit;
        }

        updateBalance.run(amount, line.account_id);
      }

      // Mark as posted
      db.db.prepare("UPDATE journal_entries SET is_posted = 1 WHERE id = ?").run(id);

      return this.findById(id);
    })();
  },

  findById(id) {
    const entry = db.db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(id);
    if (entry) {
      entry.lines = db.db.prepare(`
        SELECT jel.*, a.code as account_code, a.name as account_name
        FROM journal_entry_lines jel
        JOIN accounts a ON jel.account_id = a.id
        WHERE jel.journal_entry_id = ?
      `).all(id);
    }
    return entry;
  },

  findAll(filters = {}) {
    let sql = 'SELECT * FROM journal_entries WHERE 1=1';
    const params = [];

    if (filters.startDate) {
      sql += ' AND entry_date >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ' AND entry_date <= ?';
      params.push(filters.endDate);
    }

    if (filters.isPosted !== undefined) {
      sql += ' AND is_posted = ?';
      params.push(filters.isPosted ? 1 : 0);
    }

    sql += ' ORDER BY entry_date DESC, entry_number DESC';

    return db.db.prepare(sql).all(...params);
  }
};

module.exports = JournalEntryModel;
```

### Invoice Model (Accounts Receivable)

```javascript
// electron/database/models/invoice.js
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const JournalEntryModel = require('./journalEntry');
const Settings = require('./settings');

const InvoiceModel = {
  generateInvoiceNumber() {
    const prefix = Settings.get('invoice_prefix') || 'INV';
    const year = new Date().getFullYear();
    const count = db.db.prepare(`
      SELECT COUNT(*) as count FROM invoices
      WHERE strftime('%Y', created_at) = ?
    `).get(year.toString()).count;

    return `${prefix}-${year}-${String(count + 1).padStart(5, '0')}`;
  },

  create(data) {
    return db.db.transaction(() => {
      const invoiceId = uuidv4();
      const invoiceNumber = this.generateInvoiceNumber();

      // Insert invoice
      db.db.prepare(`
        INSERT INTO invoices (id, invoice_number, customer_id, sale_id, invoice_date, due_date,
          subtotal, tax_amount, discount_amount, total_amount, notes, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoiceId, invoiceNumber, data.customerId, data.saleId, data.invoiceDate, data.dueDate,
        data.subtotal, data.taxAmount || 0, data.discountAmount || 0, data.totalAmount,
        data.notes, data.userId
      );

      // Update customer balance
      db.db.prepare('UPDATE customers SET current_balance = current_balance + ? WHERE id = ?')
        .run(data.totalAmount, data.customerId);

      // Create journal entry
      const accounts = Settings.getAccountMappings();
      JournalEntryModel.create({
        entryDate: data.invoiceDate,
        description: `Invoice ${invoiceNumber}`,
        referenceType: 'invoice',
        referenceId: invoiceId,
        userId: data.userId,
        lines: [
          { accountId: accounts.accountsReceivable, debit: data.totalAmount, credit: 0 },
          { accountId: accounts.salesRevenue, debit: 0, credit: data.subtotal - (data.discountAmount || 0) },
          ...(data.taxAmount > 0 ? [{ accountId: accounts.salesTaxPayable, debit: 0, credit: data.taxAmount }] : [])
        ]
      });

      return this.findById(invoiceId);
    })();
  },

  recordPayment(invoiceId, paymentData) {
    return db.db.transaction(() => {
      const invoice = this.findById(invoiceId);
      if (!invoice) throw new Error('Invoice not found');

      const remaining = invoice.total_amount - invoice.amount_paid;
      if (paymentData.amount > remaining) {
        throw new Error('Payment amount exceeds remaining balance');
      }

      // Update invoice
      const newAmountPaid = invoice.amount_paid + paymentData.amount;
      const newStatus = newAmountPaid >= invoice.total_amount ? 'paid' : 'partial';

      db.db.prepare(`
        UPDATE invoices SET amount_paid = ?, status = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(newAmountPaid, newStatus, invoiceId);

      // Update customer balance
      db.db.prepare('UPDATE customers SET current_balance = current_balance - ? WHERE id = ?')
        .run(paymentData.amount, invoice.customer_id);

      // Record payment
      const paymentId = uuidv4();
      db.db.prepare(`
        INSERT INTO payments (id, payment_number, payment_type, entity_type, entity_id,
          invoice_id, payment_date, amount, payment_method, reference_number, notes, user_id)
        VALUES (?, ?, 'receipt', 'customer', ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        paymentId, this.generatePaymentNumber(), invoice.customer_id, invoiceId,
        paymentData.paymentDate, paymentData.amount, paymentData.paymentMethod,
        paymentData.referenceNumber, paymentData.notes, paymentData.userId
      );

      // Create journal entry
      const accounts = Settings.getAccountMappings();
      const cashAccount = paymentData.paymentMethod === 'cash'
        ? accounts.cashOnHand
        : accounts.bankAccount;

      JournalEntryModel.create({
        entryDate: paymentData.paymentDate,
        description: `Payment for ${invoice.invoice_number}`,
        referenceType: 'payment',
        referenceId: paymentId,
        userId: paymentData.userId,
        lines: [
          { accountId: cashAccount, debit: paymentData.amount, credit: 0 },
          { accountId: accounts.accountsReceivable, debit: 0, credit: paymentData.amount }
        ]
      });

      return this.findById(invoiceId);
    })();
  },

  generatePaymentNumber() {
    const prefix = 'RCP';
    const year = new Date().getFullYear();
    const count = db.db.prepare(`
      SELECT COUNT(*) as count FROM payments
      WHERE payment_type = 'receipt' AND strftime('%Y', created_at) = ?
    `).get(year.toString()).count;

    return `${prefix}-${year}-${String(count + 1).padStart(5, '0')}`;
  },

  findById(id) {
    const invoice = db.db.prepare(`
      SELECT i.*, c.name as customer_name, c.email as customer_email
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `).get(id);

    if (invoice) {
      invoice.payments = db.db.prepare('SELECT * FROM payments WHERE invoice_id = ?').all(id);
    }

    return invoice;
  },

  findAll(filters = {}) {
    let sql = `
      SELECT i.*, c.name as customer_name
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.customerId) {
      sql += ' AND i.customer_id = ?';
      params.push(filters.customerId);
    }

    if (filters.status) {
      sql += ' AND i.status = ?';
      params.push(filters.status);
    }

    if (filters.startDate) {
      sql += ' AND i.invoice_date >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ' AND i.invoice_date <= ?';
      params.push(filters.endDate);
    }

    sql += ' ORDER BY i.invoice_date DESC';

    return db.db.prepare(sql).all(...params);
  },

  getOverdue() {
    return db.db.prepare(`
      SELECT i.*, c.name as customer_name, c.phone as customer_phone,
        julianday('now') - julianday(i.due_date) as days_overdue
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.status IN ('unpaid', 'partial')
        AND date(i.due_date) < date('now')
      ORDER BY days_overdue DESC
    `).all();
  }
};

module.exports = InvoiceModel;
```

## Financial Reports

```javascript
// electron/database/models/financialReports.js
const db = require('../db');

const FinancialReports = {
  // Trial Balance
  getTrialBalance(asOfDate) {
    return db.db.prepare(`
      SELECT
        a.code,
        a.name,
        a.account_type,
        CASE
          WHEN a.account_type IN ('asset', 'expense') THEN a.current_balance
          ELSE 0
        END as debit_balance,
        CASE
          WHEN a.account_type IN ('liability', 'equity', 'income') THEN a.current_balance
          ELSE 0
        END as credit_balance
      FROM accounts a
      WHERE a.current_balance != 0 AND a.is_active = 1
      ORDER BY a.code
    `).all();
  },

  // Income Statement (Profit & Loss)
  getIncomeStatement(startDate, endDate) {
    const income = db.db.prepare(`
      SELECT
        a.code,
        a.name,
        SUM(jel.credit - jel.debit) as amount
      FROM accounts a
      JOIN journal_entry_lines jel ON a.id = jel.account_id
      JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE a.account_type = 'income'
        AND je.is_posted = 1
        AND je.entry_date BETWEEN ? AND ?
      GROUP BY a.id
      HAVING amount != 0
      ORDER BY a.code
    `).all(startDate, endDate);

    const expenses = db.db.prepare(`
      SELECT
        a.code,
        a.name,
        SUM(jel.debit - jel.credit) as amount
      FROM accounts a
      JOIN journal_entry_lines jel ON a.id = jel.account_id
      JOIN journal_entries je ON jel.journal_entry_id = je.id
      WHERE a.account_type = 'expense'
        AND je.is_posted = 1
        AND je.entry_date BETWEEN ? AND ?
      GROUP BY a.id
      HAVING amount != 0
      ORDER BY a.code
    `).all(startDate, endDate);

    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netIncome = totalIncome - totalExpenses;

    return {
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netIncome,
      period: { startDate, endDate }
    };
  },

  // Balance Sheet
  getBalanceSheet(asOfDate) {
    const getAccountsByType = (type) => db.db.prepare(`
      SELECT
        a.code,
        a.name,
        a.current_balance as amount
      FROM accounts a
      WHERE a.account_type = ?
        AND a.is_active = 1
        AND a.current_balance != 0
      ORDER BY a.code
    `).all(type);

    const assets = getAccountsByType('asset');
    const liabilities = getAccountsByType('liability');
    const equity = getAccountsByType('equity');

    const totalAssets = assets.reduce((sum, a) => sum + a.amount, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.amount, 0);
    const totalEquity = equity.reduce((sum, e) => sum + e.amount, 0);

    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      asOfDate
    };
  },

  // Cash Flow Statement (simplified)
  getCashFlowStatement(startDate, endDate) {
    // Operating activities
    const operatingCashFlow = db.db.prepare(`
      SELECT
        'operating' as activity_type,
        je.description,
        SUM(CASE WHEN a.code LIKE '11%' THEN jel.debit - jel.credit ELSE 0 END) as amount
      FROM journal_entry_lines jel
      JOIN journal_entries je ON jel.journal_entry_id = je.id
      JOIN accounts a ON jel.account_id = a.id
      WHERE je.is_posted = 1
        AND je.entry_date BETWEEN ? AND ?
        AND a.code LIKE '11%'
      GROUP BY je.id
      HAVING amount != 0
    `).all(startDate, endDate);

    const totalOperating = operatingCashFlow.reduce((sum, cf) => sum + cf.amount, 0);

    return {
      operatingActivities: operatingCashFlow,
      totalOperating,
      netCashFlow: totalOperating,
      period: { startDate, endDate }
    };
  },

  // Accounts Receivable Aging
  getReceivableAging() {
    return db.db.prepare(`
      SELECT
        c.id as customer_id,
        c.name as customer_name,
        c.phone,
        SUM(CASE WHEN julianday('now') - julianday(i.due_date) <= 0 THEN i.total_amount - i.amount_paid ELSE 0 END) as current,
        SUM(CASE WHEN julianday('now') - julianday(i.due_date) BETWEEN 1 AND 30 THEN i.total_amount - i.amount_paid ELSE 0 END) as days_1_30,
        SUM(CASE WHEN julianday('now') - julianday(i.due_date) BETWEEN 31 AND 60 THEN i.total_amount - i.amount_paid ELSE 0 END) as days_31_60,
        SUM(CASE WHEN julianday('now') - julianday(i.due_date) BETWEEN 61 AND 90 THEN i.total_amount - i.amount_paid ELSE 0 END) as days_61_90,
        SUM(CASE WHEN julianday('now') - julianday(i.due_date) > 90 THEN i.total_amount - i.amount_paid ELSE 0 END) as over_90,
        SUM(i.total_amount - i.amount_paid) as total_outstanding
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.status IN ('unpaid', 'partial')
      GROUP BY c.id
      HAVING total_outstanding > 0
      ORDER BY total_outstanding DESC
    `).all();
  },

  // Accounts Payable Aging
  getPayableAging() {
    return db.db.prepare(`
      SELECT
        s.id as supplier_id,
        s.name as supplier_name,
        s.phone,
        SUM(CASE WHEN julianday('now') - julianday(b.due_date) <= 0 THEN b.total_amount - b.amount_paid ELSE 0 END) as current,
        SUM(CASE WHEN julianday('now') - julianday(b.due_date) BETWEEN 1 AND 30 THEN b.total_amount - b.amount_paid ELSE 0 END) as days_1_30,
        SUM(CASE WHEN julianday('now') - julianday(b.due_date) BETWEEN 31 AND 60 THEN b.total_amount - b.amount_paid ELSE 0 END) as days_31_60,
        SUM(CASE WHEN julianday('now') - julianday(b.due_date) BETWEEN 61 AND 90 THEN b.total_amount - b.amount_paid ELSE 0 END) as days_61_90,
        SUM(CASE WHEN julianday('now') - julianday(b.due_date) > 90 THEN b.total_amount - b.amount_paid ELSE 0 END) as over_90,
        SUM(b.total_amount - b.amount_paid) as total_outstanding
      FROM bills b
      JOIN suppliers s ON b.supplier_id = s.id
      WHERE b.status IN ('unpaid', 'partial')
      GROUP BY s.id
      HAVING total_outstanding > 0
      ORDER BY total_outstanding DESC
    `).all();
  },

  // Sales Summary
  getSalesSummary(startDate, endDate, groupBy = 'day') {
    let dateFormat;
    switch (groupBy) {
      case 'month': dateFormat = '%Y-%m'; break;
      case 'week': dateFormat = '%Y-W%W'; break;
      default: dateFormat = '%Y-%m-%d';
    }

    return db.db.prepare(`
      SELECT
        strftime('${dateFormat}', created_at) as period,
        COUNT(*) as transaction_count,
        SUM(total_amount) as total_sales,
        SUM(tax_amount) as total_tax,
        SUM(discount_amount) as total_discount,
        AVG(total_amount) as average_sale
      FROM sales
      WHERE status = 'completed'
        AND date(created_at) BETWEEN ? AND ?
      GROUP BY period
      ORDER BY period
    `).all(startDate, endDate);
  }
};

module.exports = FinancialReports;
```

## UI Components

### Invoice Form

```jsx
// src/components/accounting/InvoiceForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const InvoiceForm = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    customerId: '',
    invoiceDate: dayjs().format('YYYY-MM-DD'),
    dueDate: dayjs().add(30, 'days').format('YYYY-MM-DD'),
    items: [],
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  const loadCustomers = async () => {
    const result = await window.api.getCustomers();
    setCustomers(result.data);
  };

  const loadProducts = async () => {
    const result = await window.api.getProducts({ isActive: true });
    setProducts(result.data);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 0
      }]
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'productId') {
          const product = products.find(p => p.id === value);
          if (product) {
            updated.description = product.name;
            updated.unitPrice = product.selling_price;
            updated.taxRate = product.tax_rate;
          }
        }
        return updated;
      })
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;

    formData.items.forEach(item => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemTax = itemSubtotal * (item.taxRate / 100);
      subtotal += itemSubtotal;
      taxAmount += itemTax;
    });

    return {
      subtotal,
      taxAmount,
      total: subtotal + taxAmount
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    setSaving(true);
    try {
      const totals = calculateTotals();
      const result = await window.api.createInvoice({
        ...formData,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        totalAmount: totals.total
      });

      if (result.success) {
        navigate(`/accounting/invoices/${result.data.id}`);
      } else {
        alert(result.error);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="invoice-form">
      <div className="page-header">
        <h2>New Invoice</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label>Customer *</label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                required
              >
                <option value="">Select Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Invoice Date</label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>Items</h3>
            <button type="button" onClick={addItem}>+ Add Item</button>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Tax %</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, 'productId', e.target.value)}
                    >
                      <option value="">Select</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={item.taxRate}
                      onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value))}
                    />
                  </td>
                  <td>
                    ${(item.quantity * item.unitPrice * (1 + item.taxRate / 100)).toFixed(2)}
                  </td>
                  <td>
                    <button type="button" onClick={() => removeItem(index)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-totals">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="total-row">
            <span>Tax:</span>
            <span>${totals.taxAmount.toFixed(2)}</span>
          </div>
          <div className="total-row grand-total">
            <span>Total:</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="3"
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/accounting/invoices')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceForm;
```

### Financial Reports Dashboard

```jsx
// src/components/accounting/FinancialDashboard.jsx
import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';

const FinancialDashboard = () => {
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('month').format('YYYY-MM-DD')
  });
  const [incomeStatement, setIncomeStatement] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [receivableAging, setReceivableAging] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [dateRange]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const [income, balance, aging] = await Promise.all([
        window.api.getIncomeStatement(dateRange.startDate, dateRange.endDate),
        window.api.getBalanceSheet(dateRange.endDate),
        window.api.getReceivableAging()
      ]);

      setIncomeStatement(income.data);
      setBalanceSheet(balance.data);
      setReceivableAging(aging.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="financial-dashboard">
      <div className="page-header">
        <h2>Financial Dashboard</h2>
        <div className="date-range-picker">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Key Metrics */}
        <div className="metrics-row">
          <div className="metric-card">
            <h4>Total Revenue</h4>
            <div className="metric-value">
              ${incomeStatement?.totalIncome.toFixed(2)}
            </div>
          </div>
          <div className="metric-card">
            <h4>Total Expenses</h4>
            <div className="metric-value">
              ${incomeStatement?.totalExpenses.toFixed(2)}
            </div>
          </div>
          <div className="metric-card">
            <h4>Net Income</h4>
            <div className={`metric-value ${incomeStatement?.netIncome >= 0 ? 'positive' : 'negative'}`}>
              ${incomeStatement?.netIncome.toFixed(2)}
            </div>
          </div>
          <div className="metric-card">
            <h4>Total Assets</h4>
            <div className="metric-value">
              ${balanceSheet?.totalAssets.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Income Statement Summary */}
        <div className="report-card">
          <h3>Income Statement</h3>
          <div className="report-content">
            <h4>Income</h4>
            {incomeStatement?.income.map(item => (
              <div key={item.code} className="report-row">
                <span>{item.code} - {item.name}</span>
                <span>${item.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="report-row subtotal">
              <span>Total Income</span>
              <span>${incomeStatement?.totalIncome.toFixed(2)}</span>
            </div>

            <h4>Expenses</h4>
            {incomeStatement?.expenses.map(item => (
              <div key={item.code} className="report-row">
                <span>{item.code} - {item.name}</span>
                <span>${item.amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="report-row subtotal">
              <span>Total Expenses</span>
              <span>${incomeStatement?.totalExpenses.toFixed(2)}</span>
            </div>

            <div className="report-row grand-total">
              <span>Net Income</span>
              <span>${incomeStatement?.netIncome.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Accounts Receivable Aging */}
        <div className="report-card">
          <h3>Accounts Receivable Aging</h3>
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Current</th>
                <th>1-30</th>
                <th>31-60</th>
                <th>61-90</th>
                <th>90+</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {receivableAging.map(row => (
                <tr key={row.customer_id}>
                  <td>{row.customer_name}</td>
                  <td>${row.current.toFixed(2)}</td>
                  <td>${row.days_1_30.toFixed(2)}</td>
                  <td>${row.days_31_60.toFixed(2)}</td>
                  <td>${row.days_61_90.toFixed(2)}</td>
                  <td className="overdue">${row.over_90.toFixed(2)}</td>
                  <td><strong>${row.total_outstanding.toFixed(2)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;
```
