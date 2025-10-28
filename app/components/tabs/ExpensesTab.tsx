'use client';

import { useState, useEffect } from 'react';
import { User, Expense } from '../../types';
import { storage } from '../../data/storage';
import { format } from 'date-fns';
import { exportExpensesToExcel } from '../../utils/reports';

interface ExpensesTabProps {
  user: User;
}

const EXPENSE_CATEGORIES = [
  'Packaging',
  'Delivery',
  'Utilities',
  'Labor',
  'Raw Materials',
  'Equipment',
  'Marketing',
  'Rent',
  'Maintenance',
  'Other',
];

export default function ExpensesTab({ user }: ExpensesTabProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setExpenses(storage.getExpenses());
  };

  const filteredExpenses = filterCategory === 'all'
    ? expenses
    : expenses.filter(e => e.category === filterCategory);

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = EXPENSE_CATEGORIES.map(category => {
    const total = expenses.filter(e => e.category === category).reduce((sum, e) => sum + e.amount, 0);
    return { category, total };
  }).filter(c => c.total > 0);

  return (
    <div>
      <div className="dashboard-grid">
        <div className="stat-card danger">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">₹{totalExpenses.toFixed(2)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Records</div>
          <div className="stat-value">{filteredExpenses.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Categories</div>
          <div className="stat-value">{categoryTotals.length}</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-label">Avg per Expense</div>
          <div className="stat-value">
            ₹{filteredExpenses.length > 0 ? (totalExpenses / filteredExpenses.length).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Expense Management</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => exportExpensesToExcel(expenses)} className="btn btn-secondary btn-sm">
              Export Excel
            </button>
            <button
              onClick={() => {
                setEditingExpense(null);
                setShowModal(true);
              }}
              className="btn btn-primary btn-sm"
            >
              + Add Expense
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ marginRight: '10px', fontWeight: '600' }}>Filter by Category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map(expense => (
                <tr key={expense.id}>
                  <td>{format(new Date(expense.date), 'dd/MM/yyyy')}</td>
                  <td>
                    <span className="badge badge-medium">{expense.category}</span>
                  </td>
                  <td>{expense.description}</td>
                  <td><strong>₹{expense.amount.toFixed(2)}</strong></td>
                  <td>{expense.createdBy}</td>
                  <td>
                    <button
                      onClick={() => {
                        setEditingExpense(expense);
                        setShowModal(true);
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ marginRight: '5px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this expense?')) {
                          storage.deleteExpense(expense.id);
                          loadData();
                        }
                      }}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredExpenses.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
              No expenses found.
            </div>
          )}
        </div>
      </div>

      {categoryTotals.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2>Expenses by Category</h2>
          </div>
          <div className="dashboard-grid">
            {categoryTotals.map(({ category, total }) => (
              <div key={category} className="stat-card">
                <div className="stat-label">{category}</div>
                <div className="stat-value" style={{ fontSize: '20px' }}>₹{total.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <ExpenseModal
          expense={editingExpense}
          user={user}
          onClose={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function ExpenseModal({
  expense,
  user,
  onClose,
}: {
  expense: Expense | null;
  user: User;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Expense>>(
    expense || {
      category: 'Other',
      description: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newExpense: Expense = {
      id: expense?.id || Date.now().toString(),
      category: formData.category!,
      description: formData.description!,
      amount: formData.amount!,
      date: formData.date!,
      createdBy: expense?.createdBy || user.name,
      notes: formData.notes,
    };

    if (expense) {
      storage.updateExpense(newExpense);
    } else {
      storage.addExpense(newExpense);
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{expense ? 'Edit Expense' : 'Add New Expense'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Description *</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the expense"
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Amount *</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional notes..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {expense ? 'Update' : 'Add'} Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
