'use client';

import { useState, useEffect } from 'react';
import { User, Product, RawMaterial } from '../../types';
import { storage } from '../../data/storage';
import { exportInventoryToExcel } from '../../utils/reports';

interface InventoryTabProps {
  user: User;
}

export default function InventoryTab({ user }: InventoryTabProps) {
  const [view, setView] = useState<'products' | 'materials'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Product | RawMaterial | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setProducts(storage.getProducts());
    setMaterials(storage.getRawMaterials());
  };

  const getLowStockItems = () => {
    const lowProducts = products.filter(p => p.stock <= p.lowStockThreshold);
    const lowMaterials = materials.filter(m => m.quantity <= m.lowStockThreshold);
    return { lowProducts, lowMaterials };
  };

  const { lowProducts, lowMaterials } = getLowStockItems();

  return (
    <div>
      {(lowProducts.length > 0 || lowMaterials.length > 0) && (
        <div className="alert alert-warning">
          <strong>Low Stock Alert!</strong> {lowProducts.length} products and {lowMaterials.length} raw materials are running low.
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2>Inventory Management</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => exportInventoryToExcel(products, materials)}
              className="btn btn-secondary btn-sm"
            >
              Export Excel
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => {
                  setEditingItem(null);
                  setShowModal(true);
                }}
                className="btn btn-primary btn-sm"
              >
                + Add {view === 'products' ? 'Product' : 'Material'}
              </button>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setView('products')}
            className={`btn ${view === 'products' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setView('materials')}
            className={`btn ${view === 'materials' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            Raw Materials ({materials.length})
          </button>
        </div>

        {view === 'products' ? (
          <ProductsTable
            products={products}
            onEdit={(p) => {
              setEditingItem(p);
              setShowModal(true);
            }}
            onDelete={(id) => {
              if (confirm('Delete this product?')) {
                storage.deleteProduct(id);
                loadData();
              }
            }}
            canEdit={user.role === 'admin'}
          />
        ) : (
          <MaterialsTable
            materials={materials}
            onEdit={(m) => {
              setEditingItem(m);
              setShowModal(true);
            }}
            onDelete={(id) => {
              if (confirm('Delete this material?')) {
                storage.deleteRawMaterial(id);
                loadData();
              }
            }}
            canEdit={user.role === 'admin'}
          />
        )}
      </div>

      {showModal && (
        view === 'products' ? (
          <ProductModal
            product={editingItem as Product}
            onClose={() => {
              setShowModal(false);
              loadData();
            }}
          />
        ) : (
          <MaterialModal
            material={editingItem as RawMaterial}
            onClose={() => {
              setShowModal(false);
              loadData();
            }}
          />
        )
      )}
    </div>
  );
}

function ProductsTable({
  products,
  onEdit,
  onDelete,
  canEdit,
}: {
  products: Product[];
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Cost Price</th>
            <th>Selling Price</th>
            <th>Margin</th>
            <th>Status</th>
            {canEdit && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {products.map(product => {
            const margin = ((product.price - product.cost) / product.price * 100).toFixed(1);
            const isLow = product.stock <= product.lowStockThreshold;
            return (
              <tr key={product.id}>
                <td><strong>{product.name}</strong></td>
                <td>{product.category}</td>
                <td>
                  {product.stock} {product.unit}
                  {isLow && <span style={{ color: '#dc3545', marginLeft: '8px' }}>⚠️</span>}
                </td>
                <td>₹{product.cost}</td>
                <td>₹{product.price}</td>
                <td>{margin}%</td>
                <td>
                  <span className={`badge badge-${isLow ? 'low' : 'high'}`}>
                    {isLow ? 'LOW' : 'OK'}
                  </span>
                </td>
                {canEdit && (
                  <td>
                    <button onClick={() => onEdit(product)} className="btn btn-primary btn-sm" style={{ marginRight: '5px' }}>
                      Edit
                    </button>
                    <button onClick={() => onDelete(product.id)} className="btn btn-danger btn-sm">
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MaterialsTable({
  materials,
  onEdit,
  onDelete,
  canEdit,
}: {
  materials: RawMaterial[];
  onEdit: (m: RawMaterial) => void;
  onDelete: (id: string) => void;
  canEdit: boolean;
}) {
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Material Name</th>
            <th>Quantity</th>
            <th>Cost/Unit</th>
            <th>Total Value</th>
            <th>Supplier</th>
            <th>Status</th>
            {canEdit && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {materials.map(material => {
            const isLow = material.quantity <= material.lowStockThreshold;
            const totalValue = material.quantity * material.costPerUnit;
            return (
              <tr key={material.id}>
                <td><strong>{material.name}</strong></td>
                <td>
                  {material.quantity} {material.unit}
                  {isLow && <span style={{ color: '#dc3545', marginLeft: '8px' }}>⚠️</span>}
                </td>
                <td>₹{material.costPerUnit}</td>
                <td>₹{totalValue.toFixed(2)}</td>
                <td>{material.supplier}</td>
                <td>
                  <span className={`badge badge-${isLow ? 'low' : 'high'}`}>
                    {isLow ? 'LOW' : 'OK'}
                  </span>
                </td>
                {canEdit && (
                  <td>
                    <button onClick={() => onEdit(material)} className="btn btn-primary btn-sm" style={{ marginRight: '5px' }}>
                      Edit
                    </button>
                    <button onClick={() => onDelete(material.id)} className="btn btn-danger btn-sm">
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProductModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [formData, setFormData] = useState<Partial<Product>>(
    product || {
      name: '',
      category: 'Regular',
      price: 0,
      cost: 0,
      stock: 0,
      unit: 'pack',
      lowStockThreshold: 100,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      ...formData as Product,
      id: product?.id || Date.now().toString(),
    };

    if (product) {
      storage.updateProduct(newProduct);
    } else {
      storage.addProduct(newProduct);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{product ? 'Edit Product' : 'Add New Product'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Regular">Regular</option>
                <option value="Flavored">Flavored</option>
                <option value="Premium">Premium</option>
              </select>
            </div>

            <div className="form-group">
              <label>Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="pack">Pack</option>
                <option value="box">Box</option>
                <option value="kg">Kg</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Cost Price *</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Selling Price *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Current Stock *</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) })}
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>Low Stock Threshold *</label>
              <input
                type="number"
                value={formData.lowStockThreshold}
                onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseFloat(e.target.value) })}
                min="0"
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {product ? 'Update' : 'Add'} Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MaterialModal({ material, onClose }: { material: RawMaterial | null; onClose: () => void }) {
  const [formData, setFormData] = useState<Partial<RawMaterial>>(
    material || {
      name: '',
      quantity: 0,
      unit: 'kg',
      costPerUnit: 0,
      supplier: '',
      lowStockThreshold: 10,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newMaterial: RawMaterial = {
      ...formData as RawMaterial,
      id: material?.id || Date.now().toString(),
    };

    if (material) {
      storage.updateRawMaterial(newMaterial);
    } else {
      storage.addRawMaterial(newMaterial);
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{material ? 'Edit Raw Material' : 'Add New Raw Material'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Material Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                <option value="kg">Kg</option>
                <option value="liters">Liters</option>
                <option value="pieces">Pieces</option>
                <option value="grams">Grams</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Cost Per Unit *</label>
            <input
              type="number"
              value={formData.costPerUnit}
              onChange={(e) => setFormData({ ...formData, costPerUnit: parseFloat(e.target.value) })}
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label>Supplier *</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Low Stock Threshold *</label>
            <input
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseFloat(e.target.value) })}
              min="0"
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {material ? 'Update' : 'Add'} Material
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
