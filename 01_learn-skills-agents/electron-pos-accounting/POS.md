# Point of Sales (POS) Module

## Overview

The POS module handles retail and wholesale sales transactions, payment processing, receipt generation, and real-time inventory updates.

## Key Features

- Quick product lookup (barcode/SKU/name)
- Shopping cart management
- Multiple payment methods
- Receipt printing (thermal/PDF)
- Customer management
- Sales returns/refunds
- Daily sales reports

## UI Components

### POS Terminal Component (React)

```jsx
// src/components/pos/POSTerminal.jsx
import React, { useState, useRef, useEffect } from 'react';
import ProductSearch from './ProductSearch';
import Cart from './Cart';
import PaymentModal from './PaymentModal';
import Receipt from './Receipt';

const POSTerminal = () => {
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const barcodeInputRef = useRef(null);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = cart.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
    return sum + (itemTotal * (item.taxRate || 0) / 100);
  }, 0);
  const discount = cart.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice * (item.discount || 0) / 100);
  }, 0);
  const total = subtotal + taxAmount - discount;

  // Focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Handle barcode scan
  const handleBarcodeScan = async (barcode) => {
    const product = await window.api.findProductByBarcode(barcode);
    if (product) {
      addToCart(product);
    } else {
      alert('Product not found');
    }
  };

  // Add product to cart
  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unitPrice: customer?.saleType === 'wholesale' ? product.wholesale_price : product.selling_price,
        costPrice: product.cost_price,
        taxRate: product.tax_rate,
        quantity,
        discount: 0,
        availableStock: product.current_stock
      }];
    });
  };

  // Update cart item
  const updateCartItem = (productId, updates) => {
    setCart(prev => prev.map(item =>
      item.productId === productId ? { ...item, ...updates } : item
    ));
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setCustomer(null);
  };

  // Process payment
  const handlePayment = async (paymentData) => {
    try {
      const sale = await window.api.createSale({
        customerId: customer?.id,
        saleType: customer?.saleType || 'retail',
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          discountPercent: item.discount
        })),
        amountPaid: paymentData.amountPaid,
        paymentMethod: paymentData.method,
        payments: paymentData.payments,
        userId: window.api.currentUserId
      });

      setLastSale(sale);
      setShowPayment(false);
      clearCart();

      // Print receipt if configured
      if (paymentData.printReceipt) {
        await window.api.printReceipt(sale.id);
      }
    } catch (error) {
      alert(`Error processing sale: ${error.message}`);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F4' && cart.length > 0) {
        setShowPayment(true);
      } else if (e.key === 'Escape') {
        setShowPayment(false);
      } else if (e.key === 'F9') {
        clearCart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  return (
    <div className="pos-terminal">
      <div className="pos-header">
        <h2>Point of Sale</h2>
        <div className="shortcuts-hint">
          F2: Search | F4: Pay | F9: Clear | ESC: Cancel
        </div>
      </div>

      <div className="pos-main">
        <div className="pos-left">
          {/* Barcode Input */}
          <div className="barcode-input">
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan barcode or search product..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  handleBarcodeScan(e.target.value);
                  e.target.value = '';
                }
              }}
            />
          </div>

          {/* Product Search */}
          <ProductSearch onSelect={addToCart} />
        </div>

        <div className="pos-right">
          {/* Customer Selection */}
          <div className="customer-section">
            {customer ? (
              <div className="selected-customer">
                <span>{customer.name}</span>
                <span className="customer-type">{customer.saleType}</span>
                <button onClick={() => setCustomer(null)}>×</button>
              </div>
            ) : (
              <button onClick={() => {/* Open customer search */}}>
                + Select Customer
              </button>
            )}
          </div>

          {/* Shopping Cart */}
          <Cart
            items={cart}
            onUpdateItem={updateCartItem}
            onRemoveItem={removeFromCart}
          />

          {/* Totals */}
          <div className="pos-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Tax:</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="total-row discount">
                <span>Discount:</span>
                <span>-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="total-row grand-total">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pos-actions">
            <button
              className="btn-pay"
              disabled={cart.length === 0}
              onClick={() => setShowPayment(true)}
            >
              Pay (F4)
            </button>
            <button className="btn-clear" onClick={clearCart}>
              Clear (F9)
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          total={total}
          onPayment={handlePayment}
          onClose={() => setShowPayment(false)}
        />
      )}

      {/* Receipt Preview */}
      {lastSale && (
        <Receipt
          sale={lastSale}
          onClose={() => setLastSale(null)}
          onPrint={() => window.api.printReceipt(lastSale.id)}
        />
      )}
    </div>
  );
};

export default POSTerminal;
```

### Product Search Component

```jsx
// src/components/pos/ProductSearch.jsx
import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';

const ProductSearch = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const products = await window.api.searchProducts({
          search: searchQuery,
          isActive: true,
          limit: 20
        });
        setResults(products);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    search(query);
  }, [query, search]);

  return (
    <div className="product-search">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, SKU, or barcode..."
        className="search-input"
      />

      <div className="search-results">
        {loading && <div className="loading">Searching...</div>}

        {results.map(product => (
          <div
            key={product.id}
            className="product-item"
            onClick={() => {
              onSelect(product);
              setQuery('');
              setResults([]);
            }}
          >
            <div className="product-info">
              <span className="product-name">{product.name}</span>
              <span className="product-sku">{product.sku}</span>
            </div>
            <div className="product-meta">
              <span className="product-price">${product.selling_price.toFixed(2)}</span>
              <span className={`product-stock ${product.current_stock <= product.min_stock_level ? 'low' : ''}`}>
                Stock: {product.current_stock}
              </span>
            </div>
          </div>
        ))}

        {!loading && query && results.length === 0 && (
          <div className="no-results">No products found</div>
        )}
      </div>
    </div>
  );
};

export default ProductSearch;
```

### Shopping Cart Component

```jsx
// src/components/pos/Cart.jsx
import React from 'react';

const Cart = ({ items, onUpdateItem, onRemoveItem }) => {
  return (
    <div className="cart">
      <div className="cart-header">
        <span>Item</span>
        <span>Qty</span>
        <span>Price</span>
        <span>Total</span>
        <span></span>
      </div>

      <div className="cart-items">
        {items.length === 0 ? (
          <div className="cart-empty">Cart is empty</div>
        ) : (
          items.map(item => (
            <div key={item.productId} className="cart-item">
              <div className="item-name">
                <span>{item.name}</span>
                <span className="item-sku">{item.sku}</span>
              </div>

              <div className="item-quantity">
                <button
                  onClick={() => onUpdateItem(item.productId, {
                    quantity: Math.max(1, item.quantity - 1)
                  })}
                >
                  -
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  min="1"
                  max={item.availableStock}
                  onChange={(e) => onUpdateItem(item.productId, {
                    quantity: parseInt(e.target.value) || 1
                  })}
                />
                <button
                  onClick={() => onUpdateItem(item.productId, {
                    quantity: item.quantity + 1
                  })}
                  disabled={item.quantity >= item.availableStock}
                >
                  +
                </button>
              </div>

              <div className="item-price">
                ${item.unitPrice.toFixed(2)}
                {item.discount > 0 && (
                  <span className="discount-badge">-{item.discount}%</span>
                )}
              </div>

              <div className="item-total">
                ${(item.quantity * item.unitPrice * (1 - item.discount / 100)).toFixed(2)}
              </div>

              <button
                className="btn-remove"
                onClick={() => onRemoveItem(item.productId)}
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Cart;
```

### Payment Modal Component

```jsx
// src/components/pos/PaymentModal.jsx
import React, { useState, useEffect, useRef } from 'react';

const PaymentModal = ({ total, onPayment, onClose }) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [splitPayments, setSplitPayments] = useState([]);
  const [isSplit, setIsSplit] = useState(false);
  const amountInputRef = useRef(null);

  const amountPaid = parseFloat(amountTendered) || 0;
  const change = amountPaid - total;
  const remaining = isSplit
    ? total - splitPayments.reduce((sum, p) => sum + p.amount, 0)
    : 0;

  useEffect(() => {
    amountInputRef.current?.focus();
    amountInputRef.current?.select();
  }, []);

  // Quick cash buttons
  const quickAmounts = [
    Math.ceil(total),
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 20) * 20,
    Math.ceil(total / 50) * 50,
    100
  ].filter((v, i, a) => a.indexOf(v) === i && v >= total).slice(0, 4);

  const handleSubmit = () => {
    if (isSplit) {
      const totalPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
      if (totalPaid < total) {
        alert('Payment amount is less than total');
        return;
      }
      onPayment({
        method: 'mixed',
        amountPaid: totalPaid,
        payments: splitPayments,
        printReceipt: true
      });
    } else {
      if (amountPaid < total) {
        alert('Payment amount is less than total');
        return;
      }
      onPayment({
        method: paymentMethod,
        amountPaid,
        payments: [{ method: paymentMethod, amount: amountPaid }],
        printReceipt: true
      });
    }
  };

  const addSplitPayment = () => {
    if (!amountTendered) return;
    setSplitPayments([...splitPayments, {
      method: paymentMethod,
      amount: parseFloat(amountTendered)
    }]);
    setAmountTendered('');
  };

  return (
    <div className="modal-overlay">
      <div className="payment-modal">
        <div className="modal-header">
          <h3>Payment</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="payment-total">
          <span>Total Due:</span>
          <span className="amount">${total.toFixed(2)}</span>
        </div>

        {/* Payment Method Selection */}
        <div className="payment-methods">
          {['cash', 'card', 'credit'].map(method => (
            <button
              key={method}
              className={`method-btn ${paymentMethod === method ? 'active' : ''}`}
              onClick={() => setPaymentMethod(method)}
            >
              {method.charAt(0).toUpperCase() + method.slice(1)}
            </button>
          ))}
        </div>

        {/* Split Payment Toggle */}
        <label className="split-toggle">
          <input
            type="checkbox"
            checked={isSplit}
            onChange={(e) => setIsSplit(e.target.checked)}
          />
          Split Payment
        </label>

        {/* Amount Input */}
        <div className="amount-input-section">
          <label>{isSplit ? 'Add Payment:' : 'Amount Tendered:'}</label>
          <input
            ref={amountInputRef}
            type="number"
            step="0.01"
            value={amountTendered}
            onChange={(e) => setAmountTendered(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                isSplit ? addSplitPayment() : handleSubmit();
              }
            }}
          />

          {isSplit && (
            <button onClick={addSplitPayment}>Add</button>
          )}
        </div>

        {/* Quick Cash Buttons */}
        {paymentMethod === 'cash' && !isSplit && (
          <div className="quick-amounts">
            {quickAmounts.map(amount => (
              <button
                key={amount}
                onClick={() => setAmountTendered(amount.toString())}
              >
                ${amount}
              </button>
            ))}
          </div>
        )}

        {/* Split Payments List */}
        {isSplit && splitPayments.length > 0 && (
          <div className="split-payments-list">
            {splitPayments.map((payment, index) => (
              <div key={index} className="split-payment-item">
                <span>{payment.method}</span>
                <span>${payment.amount.toFixed(2)}</span>
                <button onClick={() => {
                  setSplitPayments(splitPayments.filter((_, i) => i !== index));
                }}>×</button>
              </div>
            ))}
            <div className="remaining">
              Remaining: ${remaining.toFixed(2)}
            </div>
          </div>
        )}

        {/* Change Display */}
        {!isSplit && paymentMethod === 'cash' && change > 0 && (
          <div className="change-display">
            <span>Change:</span>
            <span className="change-amount">${change.toFixed(2)}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel (ESC)
          </button>
          <button
            className="btn-confirm"
            onClick={handleSubmit}
            disabled={isSplit ? remaining > 0 : amountPaid < total}
          >
            Complete Sale (Enter)
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
```

## Receipt Generation

### PDF Receipt with pdfmake

```javascript
// src/utils/receiptGenerator.js
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const generateReceiptPDF = (sale, companyInfo) => {
  const docDefinition = {
    pageSize: { width: 226.77, height: 'auto' }, // 80mm width
    pageMargins: [10, 10, 10, 10],
    content: [
      // Header
      { text: companyInfo.name, style: 'header', alignment: 'center' },
      { text: companyInfo.address, style: 'subheader', alignment: 'center' },
      { text: `Tel: ${companyInfo.phone}`, style: 'subheader', alignment: 'center' },
      { text: '─'.repeat(32), alignment: 'center', margin: [0, 5] },

      // Invoice Info
      { text: `Invoice: ${sale.invoice_number}`, style: 'info' },
      { text: `Date: ${new Date(sale.created_at).toLocaleString()}`, style: 'info' },
      { text: `Cashier: ${sale.cashier_name}`, style: 'info' },
      sale.customer_name && { text: `Customer: ${sale.customer_name}`, style: 'info' },
      { text: '─'.repeat(32), alignment: 'center', margin: [0, 5] },

      // Items Table
      {
        table: {
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Item', style: 'tableHeader' },
              { text: 'Qty', style: 'tableHeader', alignment: 'right' },
              { text: 'Price', style: 'tableHeader', alignment: 'right' },
              { text: 'Total', style: 'tableHeader', alignment: 'right' }
            ],
            ...sale.items.map(item => [
              { text: item.product_name, style: 'tableCell' },
              { text: item.quantity.toString(), style: 'tableCell', alignment: 'right' },
              { text: `$${item.unit_price.toFixed(2)}`, style: 'tableCell', alignment: 'right' },
              { text: `$${item.total.toFixed(2)}`, style: 'tableCell', alignment: 'right' }
            ])
          ]
        },
        layout: 'noBorders'
      },

      { text: '─'.repeat(32), alignment: 'center', margin: [0, 5] },

      // Totals
      {
        columns: [
          { text: 'Subtotal:', width: '*' },
          { text: `$${sale.subtotal.toFixed(2)}`, alignment: 'right' }
        ]
      },
      sale.tax_amount > 0 && {
        columns: [
          { text: 'Tax:', width: '*' },
          { text: `$${sale.tax_amount.toFixed(2)}`, alignment: 'right' }
        ]
      },
      sale.discount_amount > 0 && {
        columns: [
          { text: 'Discount:', width: '*' },
          { text: `-$${sale.discount_amount.toFixed(2)}`, alignment: 'right' }
        ]
      },
      {
        columns: [
          { text: 'TOTAL:', style: 'totalLabel', width: '*' },
          { text: `$${sale.total_amount.toFixed(2)}`, style: 'totalAmount', alignment: 'right' }
        ],
        margin: [0, 5, 0, 0]
      },
      {
        columns: [
          { text: `Paid (${sale.payment_method}):`, width: '*' },
          { text: `$${sale.amount_paid.toFixed(2)}`, alignment: 'right' }
        ]
      },
      sale.change_amount > 0 && {
        columns: [
          { text: 'Change:', width: '*' },
          { text: `$${sale.change_amount.toFixed(2)}`, alignment: 'right' }
        ]
      },

      { text: '─'.repeat(32), alignment: 'center', margin: [0, 10] },

      // Footer
      { text: 'Thank you for your purchase!', alignment: 'center', style: 'footer' },
      { text: companyInfo.website || '', alignment: 'center', style: 'footer' }
    ].filter(Boolean),

    styles: {
      header: { fontSize: 14, bold: true },
      subheader: { fontSize: 8 },
      info: { fontSize: 8, margin: [0, 1] },
      tableHeader: { fontSize: 8, bold: true },
      tableCell: { fontSize: 8 },
      totalLabel: { fontSize: 10, bold: true },
      totalAmount: { fontSize: 10, bold: true },
      footer: { fontSize: 8, margin: [0, 2] }
    }
  };

  return pdfMake.createPdf(docDefinition);
};

// Open PDF in new window
export const printReceipt = (sale, companyInfo) => {
  const pdf = generateReceiptPDF(sale, companyInfo);
  pdf.print();
};

// Download PDF
export const downloadReceipt = (sale, companyInfo) => {
  const pdf = generateReceiptPDF(sale, companyInfo);
  pdf.download(`receipt-${sale.invoice_number}.pdf`);
};
```

### Thermal Printer Integration

```javascript
// electron/services/printer.js
const escpos = require('escpos');
escpos.USB = require('escpos-usb');

class ThermalPrinter {
  constructor() {
    this.device = null;
    this.printer = null;
  }

  connect() {
    try {
      this.device = new escpos.USB();
      this.printer = new escpos.Printer(this.device);
      return true;
    } catch (error) {
      console.error('Printer connection failed:', error);
      return false;
    }
  }

  printReceipt(sale, companyInfo) {
    return new Promise((resolve, reject) => {
      if (!this.device) {
        if (!this.connect()) {
          reject(new Error('Cannot connect to printer'));
          return;
        }
      }

      this.device.open((error) => {
        if (error) {
          reject(error);
          return;
        }

        this.printer
          .font('a')
          .align('ct')
          .style('b')
          .size(1, 1)
          .text(companyInfo.name)
          .style('normal')
          .size(0, 0)
          .text(companyInfo.address)
          .text(`Tel: ${companyInfo.phone}`)
          .text('--------------------------------')
          .align('lt')
          .text(`Invoice: ${sale.invoice_number}`)
          .text(`Date: ${new Date(sale.created_at).toLocaleString()}`)
          .text(`Cashier: ${sale.cashier_name}`)
          .text('--------------------------------');

        // Print items
        sale.items.forEach(item => {
          this.printer
            .text(item.product_name)
            .text(`  ${item.quantity} x $${item.unit_price.toFixed(2)}   $${item.total.toFixed(2)}`);
        });

        this.printer
          .text('--------------------------------')
          .align('rt')
          .text(`Subtotal: $${sale.subtotal.toFixed(2)}`);

        if (sale.tax_amount > 0) {
          this.printer.text(`Tax: $${sale.tax_amount.toFixed(2)}`);
        }

        if (sale.discount_amount > 0) {
          this.printer.text(`Discount: -$${sale.discount_amount.toFixed(2)}`);
        }

        this.printer
          .style('b')
          .text(`TOTAL: $${sale.total_amount.toFixed(2)}`)
          .style('normal')
          .text(`Paid: $${sale.amount_paid.toFixed(2)}`);

        if (sale.change_amount > 0) {
          this.printer.text(`Change: $${sale.change_amount.toFixed(2)}`);
        }

        this.printer
          .text('--------------------------------')
          .align('ct')
          .text('Thank you for your purchase!')
          .text('')
          .cut()
          .close();

        resolve();
      });
    });
  }

  openCashDrawer() {
    return new Promise((resolve, reject) => {
      if (!this.device) {
        if (!this.connect()) {
          reject(new Error('Cannot connect to printer'));
          return;
        }
      }

      this.device.open((error) => {
        if (error) {
          reject(error);
          return;
        }

        this.printer
          .cashdraw(2) // Kick cash drawer
          .close();

        resolve();
      });
    });
  }
}

module.exports = new ThermalPrinter();
```

## IPC Handlers for POS

```javascript
// electron/ipc/posHandlers.js
const { ipcMain } = require('electron');
const SalesModel = require('../database/models/sales');
const ProductModel = require('../database/models/product');
const printer = require('../services/printer');

// Create sale
ipcMain.handle('pos:create-sale', async (event, saleData) => {
  try {
    return { success: true, data: SalesModel.create(saleData) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get sales
ipcMain.handle('pos:get-sales', async (event, filters) => {
  try {
    return { success: true, data: SalesModel.findAll(filters) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get sale by ID
ipcMain.handle('pos:get-sale', async (event, id) => {
  try {
    return { success: true, data: SalesModel.findById(id) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Void sale
ipcMain.handle('pos:void-sale', async (event, { id, userId }) => {
  try {
    return { success: true, data: SalesModel.voidSale(id, userId) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Product search
ipcMain.handle('pos:search-products', async (event, options) => {
  try {
    return { success: true, data: ProductModel.findAll(options) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Find product by barcode
ipcMain.handle('pos:find-by-barcode', async (event, barcode) => {
  try {
    const product = ProductModel.findByBarcode(barcode);
    if (!product) {
      return { success: false, error: 'Product not found' };
    }
    return { success: true, data: product };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Print receipt
ipcMain.handle('pos:print-receipt', async (event, saleId) => {
  try {
    const sale = SalesModel.findById(saleId);
    const settings = require('../database/models/settings').getAll();
    await printer.printReceipt(sale, {
      name: settings.company_name,
      address: settings.company_address,
      phone: settings.company_phone
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Open cash drawer
ipcMain.handle('pos:open-drawer', async () => {
  try {
    await printer.openCashDrawer();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Daily summary
ipcMain.handle('pos:daily-summary', async (event, date) => {
  try {
    return { success: true, data: SalesModel.getDailySummary(date) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

## CSS Styles

```css
/* src/styles/pos.css */

.pos-terminal {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.pos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #1a1a2e;
  color: white;
}

.shortcuts-hint {
  font-size: 0.8rem;
  opacity: 0.7;
}

.pos-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.pos-left {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.pos-right {
  width: 400px;
  display: flex;
  flex-direction: column;
  background: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
}

.barcode-input input {
  width: 100%;
  padding: 1rem;
  font-size: 1.2rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.barcode-input input:focus {
  border-color: #4a90d9;
  outline: none;
}

.cart {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.cart-item {
  display: grid;
  grid-template-columns: 1fr auto auto auto auto;
  gap: 0.5rem;
  align-items: center;
  padding: 0.75rem;
  border-bottom: 1px solid #eee;
}

.pos-totals {
  padding: 1rem;
  border-top: 2px solid #eee;
  background: #fafafa;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
}

.grand-total {
  font-size: 1.5rem;
  font-weight: bold;
  padding-top: 0.5rem;
  border-top: 1px solid #ddd;
}

.pos-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
}

.btn-pay {
  flex: 2;
  padding: 1rem;
  font-size: 1.2rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.btn-pay:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-clear {
  flex: 1;
  padding: 1rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* Payment Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.payment-modal {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.payment-total {
  text-align: center;
  margin: 1rem 0;
}

.payment-total .amount {
  font-size: 2.5rem;
  font-weight: bold;
  color: #1a1a2e;
}

.payment-methods {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}

.method-btn {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
}

.method-btn.active {
  border-color: #4a90d9;
  background: #e3f2fd;
}

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  margin: 1rem 0;
}

.quick-amounts button {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f5f5f5;
  cursor: pointer;
}

.change-display {
  text-align: center;
  margin: 1rem 0;
  padding: 1rem;
  background: #e8f5e9;
  border-radius: 8px;
}

.change-amount {
  font-size: 1.5rem;
  font-weight: bold;
  color: #4caf50;
}
```
