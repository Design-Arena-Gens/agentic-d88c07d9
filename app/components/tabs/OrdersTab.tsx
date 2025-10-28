'use client';

import { useState, useEffect } from 'react';
import { User, Order, OrderItem, OrderStatus, Customer } from '../../types';
import { storage } from '../../data/storage';
import { format } from 'date-fns';
import { generateInvoicePDF, exportOrdersToPDF, exportOrdersToExcel } from '../../utils/reports';

interface OrdersTabProps {
  user: User;
}

export default function OrdersTab({ user }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setOrders(storage.getOrders());
    setCustomers(storage.getCustomers());
    setProducts(storage.getProducts());
  };

  const handleCreateOrder = () => {
    setEditingOrder(null);
    setShowModal(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setShowModal(true);
  };

  const handleDeleteOrder = (id: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      storage.deleteOrder(id);
      loadData();
    }
  };

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const updatedOrder = { ...order, status: newStatus, updatedAt: new Date().toISOString() };
      storage.updateOrder(updatedOrder);
      loadData();
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Order Management</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => exportOrdersToPDF(orders)} className="btn btn-secondary btn-sm">
              Export PDF
            </button>
            <button onClick={() => exportOrdersToExcel(orders)} className="btn btn-secondary btn-sm">
              Export Excel
            </button>
            {user.role !== 'accountant' && (
              <button onClick={handleCreateOrder} className="btn btn-primary btn-sm">
                + New Order
              </button>
            )}
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td><strong>#{order.id}</strong></td>
                  <td>{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}</td>
                  <td>{order.customerName}</td>
                  <td>{order.items.length} items</td>
                  <td><strong>₹{order.total.toFixed(2)}</strong></td>
                  <td>
                    {user.role === 'staff' || user.role === 'admin' ? (
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className={`badge badge-${order.status}`}
                        style={{ border: 'none', cursor: 'pointer' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <span className={`badge badge-${order.status}`}>
                        {order.status}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${order.paymentStatus === 'paid' ? 'delivered' : 'pending'}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => generateInvoicePDF(order)}
                      className="btn btn-secondary btn-sm"
                      style={{ marginRight: '5px' }}
                    >
                      Invoice
                    </button>
                    {user.role === 'admin' && (
                      <>
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="btn btn-primary btn-sm"
                          style={{ marginRight: '5px' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="btn btn-danger btn-sm"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              No orders found. Create your first order!
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <OrderModal
          order={editingOrder}
          customers={customers}
          products={products}
          onClose={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

interface OrderModalProps {
  order: Order | null;
  customers: Customer[];
  products: any[];
  onClose: () => void;
}

function OrderModal({ order, customers, products, onClose }: OrderModalProps) {
  const [customerId, setCustomerId] = useState(order?.customerId || '');
  const [items, setItems] = useState<OrderItem[]>(order?.items || []);
  const [paymentMethod, setPaymentMethod] = useState(order?.paymentMethod || 'cash');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>(order?.paymentStatus || 'pending');
  const [notes, setNotes] = useState(order?.notes || '');
  const [gstRate] = useState(order?.gstRate || 18);

  const addItem = () => {
    if (products.length === 0) return;
    const product = products[0];
    setItems([...items, {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
      cost: product.cost,
    }]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: value,
          productName: product.name,
          price: product.price,
          cost: product.cost,
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const gstAmount = subtotal * (gstRate / 100);
    const total = subtotal + gstAmount;
    return { subtotal, gstAmount, total };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      alert('Please select a customer');
      return;
    }

    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;

    const { subtotal, gstAmount, total } = calculateTotals();

    const newOrder: Order = {
      id: order?.id || Date.now().toString(),
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerGst: customer.gstNumber,
      items,
      subtotal,
      gstAmount,
      gstRate,
      total,
      status: order?.status || 'pending',
      paymentMethod,
      paymentStatus,
      createdAt: order?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes,
    };

    if (order) {
      storage.updateOrder(newOrder);
    } else {
      storage.addOrder(newOrder);
    }

    onClose();
  };

  const { subtotal, gstAmount, total } = calculateTotals();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{order ? 'Edit Order' : 'Create New Order'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Customer *</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">Select Customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Order Items *</label>
            {items.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <select
                  value={item.productId}
                  onChange={(e) => updateItem(index, 'productId', e.target.value)}
                  style={{ flex: 2 }}
                  required
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  min="1"
                  placeholder="Qty"
                  style={{ flex: 1 }}
                  required
                />
                <button type="button" onClick={() => removeItem(index)} className="btn btn-danger btn-sm">
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={addItem} className="btn btn-secondary btn-sm">
              + Add Item
            </button>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Payment Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            <div className="form-group">
              <label>Payment Status</label>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as 'pending' | 'paid')}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Subtotal:</span>
              <strong>₹{subtotal.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>GST ({gstRate}%):</span>
              <strong>₹{gstAmount.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', paddingTop: '8px', borderTop: '2px solid #dee2e6' }}>
              <span><strong>Total:</strong></span>
              <strong style={{ color: '#667eea' }}>₹{total.toFixed(2)}</strong>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {order ? 'Update Order' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
