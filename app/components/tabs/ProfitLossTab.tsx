'use client';

import { useState, useEffect } from 'react';
import { User, Order, Expense } from '../../types';
import { storage } from '../../data/storage';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, format, subMonths } from 'date-fns';
import { exportProfitLossToPDF } from '../../utils/reports';

interface ProfitLossTabProps {
  user: User;
}

type Period = 'today' | 'week' | 'month' | 'custom';

export default function ProfitLossTab({ user }: ProfitLossTabProps) {
  const [period, setPeriod] = useState<Period>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    setOrders(storage.getOrders());
    setExpenses(storage.getExpenses());
  }, []);

  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();

    switch (period) {
      case 'today':
        return {
          start: new Date(now.setHours(0, 0, 0, 0)),
          end: new Date(now.setHours(23, 59, 59, 999)),
        };
      case 'week':
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        };
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
      case 'custom':
        return {
          start: startDate ? new Date(startDate) : startOfMonth(now),
          end: endDate ? new Date(endDate) : endOfMonth(now),
        };
      default:
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
    }
  };

  const { start, end } = getDateRange();

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return isWithinInterval(orderDate, { start, end }) && order.status !== 'cancelled';
  });

  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return isWithinInterval(expenseDate, { start, end });
  });

  // Calculate metrics
  const revenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const cogs = filteredOrders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => itemSum + (item.cost * item.quantity), 0);
  }, 0);
  const grossProfit = revenue - cogs;
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  // Calculate previous period for comparison
  const getPreviousPeriodData = () => {
    const prevStart = subMonths(start, 1);
    const prevEnd = subMonths(end, 1);

    const prevOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return isWithinInterval(orderDate, { start: prevStart, end: prevEnd }) && order.status !== 'cancelled';
    });

    const prevRevenue = prevOrders.reduce((sum, order) => sum + order.total, 0);
    return { prevRevenue, growth: prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue * 100) : 0 };
  };

  const { prevRevenue, growth } = getPreviousPeriodData();

  const periodLabel = period === 'custom'
    ? `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`
    : period === 'today'
    ? 'Today'
    : period === 'week'
    ? 'This Week'
    : 'This Month';

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Profit & Loss Report</h2>
          <button
            onClick={() => exportProfitLossToPDF(revenue, cogs, totalExpenses, periodLabel)}
            className="btn btn-secondary btn-sm"
          >
            Export PDF
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setPeriod('today')}
            className={`btn ${period === 'today' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`btn ${period === 'week' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`btn ${period === 'month' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            This Month
          </button>
          <button
            onClick={() => setPeriod('custom')}
            className={`btn ${period === 'custom' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          >
            Custom Range
          </button>
        </div>

        {period === 'custom' && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>
        )}

        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px', color: '#667eea' }}>{periodLabel}</h3>
          <div style={{ fontSize: '14px', color: '#666' }}>
            {format(start, 'dd MMM yyyy')} - {format(end, 'dd MMM yyyy')}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card success">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">₹{revenue.toFixed(2)}</div>
          {growth !== 0 && (
            <div style={{ fontSize: '12px', color: growth > 0 ? '#28a745' : '#dc3545', marginTop: '5px' }}>
              {growth > 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}% from prev period
            </div>
          )}
        </div>

        <div className="stat-card danger">
          <div className="stat-label">Cost of Goods Sold</div>
          <div className="stat-value">₹{cogs.toFixed(2)}</div>
        </div>

        <div className="stat-card info">
          <div className="stat-label">Gross Profit</div>
          <div className="stat-value">₹{grossProfit.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            {grossMargin.toFixed(1)}% margin
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-label">Operating Expenses</div>
          <div className="stat-value">₹{totalExpenses.toFixed(2)}</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>Financial Summary</h2>

        <div style={{ background: 'white', borderRadius: '8px' }}>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                <td style={{ padding: '15px', fontWeight: '600', fontSize: '16px' }}>Revenue</td>
                <td style={{ padding: '15px', textAlign: 'right', fontSize: '16px', color: '#28a745' }}>
                  ₹{revenue.toFixed(2)}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                <td style={{ padding: '15px', paddingLeft: '30px' }}>Cost of Goods Sold</td>
                <td style={{ padding: '15px', textAlign: 'right', color: '#dc3545' }}>
                  - ₹{cogs.toFixed(2)}
                </td>
              </tr>
              <tr style={{ borderBottom: '2px solid #667eea', background: '#f8f9fa' }}>
                <td style={{ padding: '15px', fontWeight: '600' }}>Gross Profit</td>
                <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600' }}>
                  ₹{grossProfit.toFixed(2)}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                <td style={{ padding: '15px', paddingLeft: '30px' }}>Operating Expenses</td>
                <td style={{ padding: '15px', textAlign: 'right', color: '#dc3545' }}>
                  - ₹{totalExpenses.toFixed(2)}
                </td>
              </tr>
              <tr style={{ background: netProfit >= 0 ? '#d4edda' : '#f8d7da' }}>
                <td style={{ padding: '20px', fontWeight: '700', fontSize: '18px' }}>Net Profit</td>
                <td style={{ padding: '20px', textAlign: 'right', fontWeight: '700', fontSize: '18px', color: netProfit >= 0 ? '#155724' : '#721c24' }}>
                  ₹{netProfit.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '15px', fontWeight: '600' }}>Profit Margin</td>
                <td style={{ padding: '15px', textAlign: 'right', fontWeight: '600', color: profitMargin >= 0 ? '#28a745' : '#dc3545' }}>
                  {profitMargin.toFixed(2)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '15px' }}>Key Metrics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Orders</div>
              <div style={{ fontSize: '20px', fontWeight: '600' }}>{filteredOrders.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Average Order Value</div>
              <div style={{ fontSize: '20px', fontWeight: '600' }}>
                ₹{filteredOrders.length > 0 ? (revenue / filteredOrders.length).toFixed(2) : '0.00'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Total Expense Records</div>
              <div style={{ fontSize: '20px', fontWeight: '600' }}>{filteredExpenses.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>COGS Percentage</div>
              <div style={{ fontSize: '20px', fontWeight: '600' }}>
                {revenue > 0 ? ((cogs / revenue) * 100).toFixed(1) : '0'}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
