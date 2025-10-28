'use client';

import { useState, useEffect } from 'react';
import { User, Customer } from '../../types';
import { storage } from '../../data/storage';

interface CustomersTabProps {
  user: User;
}

export default function CustomersTab({ user }: CustomersTabProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCustomers(storage.getCustomers());
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Customer Management</h2>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setShowModal(true);
            }}
            className="btn btn-primary btn-sm"
          >
            + Add Customer
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '10px 15px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>GST Number</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id}>
                  <td><strong>{customer.name}</strong></td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.gstNumber || '-'}</td>
                  <td>{customer.address}</td>
                  <td>
                    <button
                      onClick={() => {
                        setEditingCustomer(customer);
                        setShowModal(true);
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ marginRight: '5px' }}
                    >
                      Edit
                    </button>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          if (confirm('Delete this customer?')) {
                            storage.deleteCustomer(customer.id);
                            loadData();
                          }
                        }}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              {searchTerm ? 'No customers found matching your search.' : 'No customers found. Add your first customer!'}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function CustomerModal({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const [formData, setFormData] = useState<Partial<Customer>>(
    customer || {
      name: '',
      email: '',
      phone: '',
      address: '',
      gstNumber: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newCustomer: Customer = {
      id: customer?.id || Date.now().toString(),
      name: formData.name!,
      email: formData.email!,
      phone: formData.phone!,
      address: formData.address!,
      gstNumber: formData.gstNumber || undefined,
    };

    if (customer) {
      storage.updateCustomer(newCustomer);
    } else {
      storage.addCustomer(newCustomer);
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>GST Number (Optional)</label>
            <input
              type="text"
              value={formData.gstNumber}
              onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
              placeholder="e.g., 24AAAAA0000A1Z5"
            />
          </div>

          <div className="form-group">
            <label>Address *</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {customer ? 'Update' : 'Add'} Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
