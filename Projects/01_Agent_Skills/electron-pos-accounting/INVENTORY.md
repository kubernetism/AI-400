# Inventory Management Module

## Overview

The Inventory Management module handles product catalog management, stock tracking, purchase orders, supplier management, and inventory reports.

## Key Features

- Product management (CRUD)
- Category hierarchy
- Stock level tracking
- Low stock alerts
- Purchase order management
- Supplier management
- Stock adjustments
- Inventory valuation reports

## UI Components

### Product List Component

```jsx
// src/components/inventory/ProductList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    stockStatus: 'all'
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [filters]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await window.api.getProducts({
        search: filters.search,
        categoryId: filters.categoryId || undefined,
        isActive: true
      });

      let filteredProducts = result.data;

      // Apply stock status filter
      if (filters.stockStatus === 'low') {
        filteredProducts = filteredProducts.filter(p => p.current_stock <= p.min_stock_level);
      } else if (filters.stockStatus === 'out') {
        filteredProducts = filteredProducts.filter(p => p.current_stock === 0);
      }

      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    const result = await window.api.getCategories();
    setCategories(result.data);
  };

  const handleExport = async () => {
    await window.api.exportProducts(products);
  };

  return (
    <div className="product-list-page">
      <div className="page-header">
        <h2>Products</h2>
        <div className="header-actions">
          <button onClick={handleExport}>Export</button>
          <button className="btn-primary" onClick={() => navigate('/inventory/products/new')}>
            + Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />

        <select
          value={filters.categoryId}
          onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <select
          value={filters.stockStatus}
          onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
        >
          <option value="all">All Stock Status</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Barcode</th>
              <th>Name</th>
              <th>Category</th>
              <th>Cost</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan="9">No products found</td></tr>
            ) : (
              products.map(product => (
                <tr key={product.id}>
                  <td>{product.sku}</td>
                  <td>{product.barcode || '-'}</td>
                  <td>{product.name}</td>
                  <td>{product.category_name || '-'}</td>
                  <td>${product.cost_price.toFixed(2)}</td>
                  <td>${product.selling_price.toFixed(2)}</td>
                  <td className={getStockClass(product)}>
                    {product.current_stock}
                  </td>
                  <td>
                    <span className={`status-badge ${getStockStatus(product)}`}>
                      {getStockStatus(product)}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => navigate(`/inventory/products/${product.id}`)}>
                      Edit
                    </button>
                    <button onClick={() => openAdjustmentModal(product)}>
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const getStockClass = (product) => {
  if (product.current_stock === 0) return 'stock-out';
  if (product.current_stock <= product.min_stock_level) return 'stock-low';
  return 'stock-ok';
};

const getStockStatus = (product) => {
  if (product.current_stock === 0) return 'out-of-stock';
  if (product.current_stock <= product.min_stock_level) return 'low-stock';
  return 'in-stock';
};

export default ProductList;
```

### Product Form Component

```jsx
// src/components/inventory/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    description: '',
    categoryId: '',
    unit: 'pcs',
    costPrice: '',
    sellingPrice: '',
    wholesalePrice: '',
    minStockLevel: '0',
    maxStockLevel: '',
    taxRate: '0',
    isActive: true
  });

  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadCategories = async () => {
    const result = await window.api.getCategories();
    setCategories(result.data);
  };

  const loadProduct = async () => {
    const result = await window.api.getProduct(id);
    if (result.success) {
      const p = result.data;
      setFormData({
        sku: p.sku,
        barcode: p.barcode || '',
        name: p.name,
        description: p.description || '',
        categoryId: p.category_id || '',
        unit: p.unit,
        costPrice: p.cost_price.toString(),
        sellingPrice: p.selling_price.toString(),
        wholesalePrice: p.wholesale_price?.toString() || '',
        minStockLevel: p.min_stock_level.toString(),
        maxStockLevel: p.max_stock_level?.toString() || '',
        taxRate: p.tax_rate.toString(),
        isActive: p.is_active === 1
      });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      newErrors.sellingPrice = 'Valid selling price is required';
    }
    if (formData.costPrice && parseFloat(formData.costPrice) < 0) {
      newErrors.costPrice = 'Cost price cannot be negative';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const data = {
        ...formData,
        costPrice: parseFloat(formData.costPrice) || 0,
        sellingPrice: parseFloat(formData.sellingPrice),
        wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : null,
        minStockLevel: parseInt(formData.minStockLevel) || 0,
        maxStockLevel: formData.maxStockLevel ? parseInt(formData.maxStockLevel) : null,
        taxRate: parseFloat(formData.taxRate) || 0
      };

      let result;
      if (isEdit) {
        result = await window.api.updateProduct(id, data);
      } else {
        result = await window.api.createProduct(data);
      }

      if (result.success) {
        navigate('/inventory/products');
      } else {
        setErrors({ submit: result.error });
      }
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="product-form-page">
      <div className="page-header">
        <h2>{isEdit ? 'Edit Product' : 'New Product'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="form-container">
        {errors.submit && <div className="error-banner">{errors.submit}</div>}

        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>SKU *</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className={errors.sku ? 'error' : ''}
              />
              {errors.sku && <span className="error-text">{errors.sku}</span>}
            </div>

            <div className="form-group">
              <label>Barcode</label>
              <input
                type="text"
                name="barcode"
                value={formData.barcode}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Unit</label>
              <select name="unit" value={formData.unit} onChange={handleChange}>
                <option value="pcs">Pieces</option>
                <option value="kg">Kilogram</option>
                <option value="g">Gram</option>
                <option value="l">Liter</option>
                <option value="ml">Milliliter</option>
                <option value="m">Meter</option>
                <option value="box">Box</option>
                <option value="pack">Pack</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Pricing</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Cost Price</label>
              <input
                type="number"
                step="0.01"
                name="costPrice"
                value={formData.costPrice}
                onChange={handleChange}
                className={errors.costPrice ? 'error' : ''}
              />
              {errors.costPrice && <span className="error-text">{errors.costPrice}</span>}
            </div>

            <div className="form-group">
              <label>Selling Price *</label>
              <input
                type="number"
                step="0.01"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                className={errors.sellingPrice ? 'error' : ''}
              />
              {errors.sellingPrice && <span className="error-text">{errors.sellingPrice}</span>}
            </div>

            <div className="form-group">
              <label>Wholesale Price</label>
              <input
                type="number"
                step="0.01"
                name="wholesalePrice"
                value={formData.wholesalePrice}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              name="taxRate"
              value={formData.taxRate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>Inventory</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Minimum Stock Level</label>
              <input
                type="number"
                name="minStockLevel"
                value={formData.minStockLevel}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Maximum Stock Level</label>
              <input
                type="number"
                name="maxStockLevel"
                value={formData.maxStockLevel}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            Active
          </label>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/inventory/products')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
```

### Stock Adjustment Modal

```jsx
// src/components/inventory/StockAdjustmentModal.jsx
import React, { useState } from 'react';

const StockAdjustmentModal = ({ product, onClose, onSave }) => {
  const [adjustment, setAdjustment] = useState({
    type: 'adjustment',
    quantity: '',
    operation: 'add',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!adjustment.quantity) return;

    setSaving(true);
    try {
      const quantity = adjustment.operation === 'add'
        ? parseInt(adjustment.quantity)
        : -parseInt(adjustment.quantity);

      await window.api.adjustStock({
        productId: product.id,
        transactionType: adjustment.type,
        quantity,
        notes: adjustment.notes
      });

      onSave();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Adjust Stock</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="product-info-summary">
          <p><strong>{product.name}</strong></p>
          <p>SKU: {product.sku}</p>
          <p>Current Stock: <strong>{product.current_stock}</strong></p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Adjustment Type</label>
            <select
              value={adjustment.type}
              onChange={(e) => setAdjustment({ ...adjustment, type: e.target.value })}
            >
              <option value="adjustment">Manual Adjustment</option>
              <option value="damage">Damaged/Expired</option>
              <option value="transfer">Transfer</option>
              <option value="return">Customer Return</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Operation</label>
              <select
                value={adjustment.operation}
                onChange={(e) => setAdjustment({ ...adjustment, operation: e.target.value })}
              >
                <option value="add">Add (+)</option>
                <option value="subtract">Subtract (-)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                min="1"
                value={adjustment.quantity}
                onChange={(e) => setAdjustment({ ...adjustment, quantity: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="new-stock-preview">
            New Stock: {adjustment.quantity ? (
              adjustment.operation === 'add'
                ? product.current_stock + parseInt(adjustment.quantity)
                : product.current_stock - parseInt(adjustment.quantity)
            ) : product.current_stock}
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={adjustment.notes}
              onChange={(e) => setAdjustment({ ...adjustment, notes: e.target.value })}
              rows="2"
              placeholder="Reason for adjustment..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving || !adjustment.quantity}>
              {saving ? 'Saving...' : 'Save Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustmentModal;
```

### Purchase Order Form

```jsx
// src/components/inventory/PurchaseOrderForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PurchaseOrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [orderData, setOrderData] = useState({
    supplierId: '',
    expectedDate: '',
    notes: '',
    items: []
  });

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSuppliers();
    loadProducts();
    if (isEdit) loadOrder();
  }, [id]);

  const loadSuppliers = async () => {
    const result = await window.api.getSuppliers();
    setSuppliers(result.data);
  };

  const loadProducts = async () => {
    const result = await window.api.getProducts({ isActive: true });
    setProducts(result.data);
  };

  const loadOrder = async () => {
    const result = await window.api.getPurchaseOrder(id);
    if (result.success) {
      setOrderData(result.data);
    }
  };

  const addItem = () => {
    setOrderData(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: '',
        quantityOrdered: 1,
        unitCost: 0,
        taxRate: 0,
        discountPercent: 0
      }]
    }));
  };

  const updateItem = (index, field, value) => {
    setOrderData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;

        const updated = { ...item, [field]: value };

        // Auto-fill cost when product selected
        if (field === 'productId') {
          const product = products.find(p => p.id === value);
          if (product) {
            updated.unitCost = product.cost_price;
            updated.taxRate = product.tax_rate;
          }
        }

        return updated;
      })
    }));
  };

  const removeItem = (index) => {
    setOrderData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateItemTotal = (item) => {
    const subtotal = item.quantityOrdered * item.unitCost;
    const discount = subtotal * (item.discountPercent / 100);
    const tax = (subtotal - discount) * (item.taxRate / 100);
    return subtotal - discount + tax;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    orderData.items.forEach(item => {
      const itemSubtotal = item.quantityOrdered * item.unitCost;
      const itemDiscount = itemSubtotal * (item.discountPercent / 100);
      const itemTax = (itemSubtotal - itemDiscount) * (item.taxRate / 100);

      subtotal += itemSubtotal;
      discountAmount += itemDiscount;
      taxAmount += itemTax;
    });

    return {
      subtotal,
      taxAmount,
      discountAmount,
      total: subtotal - discountAmount + taxAmount
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (orderData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    setSaving(true);
    try {
      const totals = calculateTotals();
      const data = {
        ...orderData,
        ...totals,
        items: orderData.items.map(item => ({
          ...item,
          total: calculateItemTotal(item)
        }))
      };

      let result;
      if (isEdit) {
        result = await window.api.updatePurchaseOrder(id, data);
      } else {
        result = await window.api.createPurchaseOrder(data);
      }

      if (result.success) {
        navigate('/inventory/purchase-orders');
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
    <div className="purchase-order-form">
      <div className="page-header">
        <h2>{isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label>Supplier *</label>
              <select
                value={orderData.supplierId}
                onChange={(e) => setOrderData({ ...orderData, supplierId: e.target.value })}
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Expected Date</label>
              <input
                type="date"
                value={orderData.expectedDate}
                onChange={(e) => setOrderData({ ...orderData, expectedDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="form-section">
          <div className="section-header">
            <h3>Order Items</h3>
            <button type="button" onClick={addItem}>+ Add Item</button>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Cost</th>
                <th>Tax %</th>
                <th>Discount %</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orderData.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, 'productId', e.target.value)}
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={item.quantityOrdered}
                      onChange={(e) => updateItem(index, 'quantityOrdered', parseInt(e.target.value))}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitCost}
                      onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value))}
                      required
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
                    <input
                      type="number"
                      step="0.01"
                      value={item.discountPercent}
                      onChange={(e) => updateItem(index, 'discountPercent', parseFloat(e.target.value))}
                    />
                  </td>
                  <td>${calculateItemTotal(item).toFixed(2)}</td>
                  <td>
                    <button type="button" onClick={() => removeItem(index)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {orderData.items.length === 0 && (
            <div className="empty-items">No items added. Click "Add Item" to start.</div>
          )}
        </div>

        {/* Totals */}
        <div className="order-totals">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="total-row">
            <span>Discount:</span>
            <span>-${totals.discountAmount.toFixed(2)}</span>
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
            value={orderData.notes}
            onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
            rows="3"
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/inventory/purchase-orders')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : (isEdit ? 'Update Order' : 'Create Order')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseOrderForm;
```

## IPC Handlers

```javascript
// electron/ipc/inventoryHandlers.js
const { ipcMain } = require('electron');
const ProductModel = require('../database/models/product');
const CategoryModel = require('../database/models/category');
const SupplierModel = require('../database/models/supplier');
const PurchaseOrderModel = require('../database/models/purchaseOrder');

// Products
ipcMain.handle('inventory:get-products', async (event, options) => {
  try {
    return { success: true, data: ProductModel.findAll(options) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('inventory:get-product', async (event, id) => {
  try {
    return { success: true, data: ProductModel.findById(id) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('inventory:create-product', async (event, data) => {
  try {
    return { success: true, data: ProductModel.create(data) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('inventory:update-product', async (event, id, data) => {
  try {
    return { success: true, data: ProductModel.update(id, data) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('inventory:adjust-stock', async (event, { productId, transactionType, quantity, notes }) => {
  try {
    return { success: true, data: ProductModel.updateStock(productId, quantity, transactionType, event.sender.userId, notes) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('inventory:get-low-stock', async () => {
  try {
    return { success: true, data: ProductModel.getLowStock() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Categories
ipcMain.handle('inventory:get-categories', async () => {
  try {
    return { success: true, data: CategoryModel.findAll() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('inventory:create-category', async (event, data) => {
  try {
    return { success: true, data: CategoryModel.create(data) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Suppliers
ipcMain.handle('inventory:get-suppliers', async (event, options) => {
  try {
    return { success: true, data: SupplierModel.findAll(options) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('inventory:create-supplier', async (event, data) => {
  try {
    return { success: true, data: SupplierModel.create(data) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('inventory:update-supplier', async (event, id, data) => {
  try {
    return { success: true, data: SupplierModel.update(id, data) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Purchase Orders
ipcMain.handle('inventory:get-purchase-orders', async (event, filters) => {
  try {
    return { success: true, data: PurchaseOrderModel.findAll(filters) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('inventory:get-purchase-order', async (event, id) => {
  try {
    return { success: true, data: PurchaseOrderModel.findById(id) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('inventory:create-purchase-order', async (event, data) => {
  try {
    return { success: true, data: PurchaseOrderModel.create(data) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('inventory:receive-purchase-order', async (event, id, receivedItems) => {
  try {
    return { success: true, data: PurchaseOrderModel.receiveItems(id, receivedItems) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

## Inventory Reports

```javascript
// electron/database/models/inventoryReports.js
const db = require('../db');

const InventoryReports = {
  // Stock valuation report
  getStockValuation() {
    return db.db.prepare(`
      SELECT
        p.id,
        p.sku,
        p.name,
        c.name as category,
        p.current_stock,
        p.cost_price,
        p.selling_price,
        (p.current_stock * p.cost_price) as cost_value,
        (p.current_stock * p.selling_price) as retail_value
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1 AND p.current_stock > 0
      ORDER BY cost_value DESC
    `).all();
  },

  // Stock movement report
  getStockMovement(startDate, endDate, productId = null) {
    let sql = `
      SELECT
        it.created_at as date,
        p.sku,
        p.name as product_name,
        it.transaction_type,
        it.quantity,
        it.unit_cost,
        it.reference_type,
        it.reference_id,
        u.full_name as user_name
      FROM inventory_transactions it
      JOIN products p ON it.product_id = p.id
      LEFT JOIN users u ON it.user_id = u.id
      WHERE date(it.created_at) BETWEEN ? AND ?
    `;
    const params = [startDate, endDate];

    if (productId) {
      sql += ' AND it.product_id = ?';
      params.push(productId);
    }

    sql += ' ORDER BY it.created_at DESC';

    return db.db.prepare(sql).all(...params);
  },

  // Low stock report
  getLowStockReport() {
    return db.db.prepare(`
      SELECT
        p.id,
        p.sku,
        p.name,
        c.name as category,
        p.current_stock,
        p.min_stock_level,
        p.max_stock_level,
        (p.min_stock_level - p.current_stock) as shortage,
        p.cost_price,
        s.name as preferred_supplier
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = 1 AND p.current_stock <= p.min_stock_level
      ORDER BY (p.current_stock - p.min_stock_level)
    `).all();
  },

  // Product sales analysis
  getProductSalesAnalysis(startDate, endDate) {
    return db.db.prepare(`
      SELECT
        p.id,
        p.sku,
        p.name,
        c.name as category,
        SUM(si.quantity) as total_sold,
        SUM(si.total) as total_revenue,
        SUM(si.quantity * si.cost_price) as total_cost,
        SUM(si.total) - SUM(si.quantity * si.cost_price) as gross_profit,
        ROUND((SUM(si.total) - SUM(si.quantity * si.cost_price)) * 100.0 / SUM(si.total), 2) as profit_margin
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE s.status = 'completed'
        AND date(s.created_at) BETWEEN ? AND ?
      GROUP BY p.id
      ORDER BY total_revenue DESC
    `).all(startDate, endDate);
  },

  // Category performance
  getCategoryPerformance(startDate, endDate) {
    return db.db.prepare(`
      SELECT
        c.id,
        c.name as category,
        COUNT(DISTINCT p.id) as product_count,
        SUM(p.current_stock) as total_stock,
        SUM(p.current_stock * p.cost_price) as stock_value,
        COALESCE(sales.total_sold, 0) as total_sold,
        COALESCE(sales.total_revenue, 0) as total_revenue
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
      LEFT JOIN (
        SELECT
          p2.category_id,
          SUM(si.quantity) as total_sold,
          SUM(si.total) as total_revenue
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p2 ON si.product_id = p2.id
        WHERE s.status = 'completed'
          AND date(s.created_at) BETWEEN ? AND ?
        GROUP BY p2.category_id
      ) sales ON sales.category_id = c.id
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY total_revenue DESC
    `).all(startDate, endDate);
  }
};

module.exports = InventoryReports;
```
