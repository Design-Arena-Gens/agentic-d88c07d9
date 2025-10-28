'use client';

import { useState, useEffect } from 'react';
import { User, Order } from '../../types';
import { storage } from '../../data/storage';
import { format, subDays, startOfDay, isWithinInterval } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsTabProps {
  user: User;
}

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'];

export default function AnalyticsTab({ user }: AnalyticsTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setOrders(storage.getOrders());
    setProducts(storage.getProducts());
  }, []);

  // Sales trend data
  const getSalesTrendData = () => {
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return isWithinInterval(orderDate, { start: dayStart, end: dayEnd }) && order.status !== 'cancelled';
      });

      const revenue = dayOrders.reduce((sum, order) => sum + order.total, 0);

      data.push({
        date: format(date, 'dd/MM'),
        revenue: parseFloat(revenue.toFixed(2)),
        orders: dayOrders.length,
      });
    }
    return data;
  };

  // Top products
  const getTopProducts = () => {
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        order.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = {
              name: item.productName,
              quantity: 0,
              revenue: 0,
            };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.quantity * item.price;
        });
      }
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  };

  // Order status distribution
  const getOrderStatusData = () => {
    const statusCount: Record<string, number> = {};

    orders.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }));
  };

  // Customer repeat rate
  const getCustomerMetrics = () => {
    const customerOrders: Record<string, number> = {};

    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        customerOrders[order.customerId] = (customerOrders[order.customerId] || 0) + 1;
      }
    });

    const totalCustomers = Object.keys(customerOrders).length;
    const repeatCustomers = Object.values(customerOrders).filter(count => count > 1).length;
    const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    return { totalCustomers, repeatCustomers, repeatRate };
  };

  // Payment method distribution
  const getPaymentMethodData = () => {
    const methodCount: Record<string, number> = {};

    orders.forEach(order => {
      if (order.status !== 'cancelled') {
        const method = order.paymentMethod.replace('_', ' ').toUpperCase();
        methodCount[method] = (methodCount[method] || 0) + 1;
      }
    });

    return Object.entries(methodCount).map(([name, value]) => ({ name, value }));
  };

  const salesTrendData = getSalesTrendData();
  const topProducts = getTopProducts();
  const orderStatusData = getOrderStatusData();
  const paymentMethodData = getPaymentMethodData();
  const { totalCustomers, repeatCustomers, repeatRate } = getCustomerMetrics();

  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const totalOrders = orders.filter(o => o.status !== 'cancelled').length;

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div>
      <div className="dashboard-grid">
        <div className="stat-card success">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">₹{totalRevenue.toFixed(2)}</div>
        </div>

        <div className="stat-card info">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{totalOrders}</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-label">Avg Order Value</div>
          <div className="stat-value">₹{avgOrderValue.toFixed(2)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Repeat Customer Rate</div>
          <div className="stat-value">{repeatRate.toFixed(1)}%</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Sales Trend</h2>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={() => setDays(7)}
              className={`btn ${days === 7 ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDays(30)}
              className={`btn ${days === 30 ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              30 Days
            </button>
            <button
              onClick={() => setDays(90)}
              className={`btn ${days === 90 ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            >
              90 Days
            </button>
          </div>
        </div>
        <div style={{ height: '400px', marginTop: '20px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="#667eea"
                strokeWidth={2}
                name="Revenue (₹)"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="orders"
                stroke="#28a745"
                strokeWidth={2}
                name="Orders"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px' }}>
        <div className="card">
          <div className="card-header">
            <h2>Top Selling Products</h2>
          </div>
          <div style={{ height: '400px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantity" fill="#667eea" name="Quantity Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Order Status Distribution</h2>
          </div>
          <div style={{ height: '400px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Revenue by Product</h2>
          </div>
          <div style={{ height: '400px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#28a745" name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Payment Methods</h2>
          </div>
          <div style={{ height: '400px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Customer Insights</h2>
        </div>
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-label">Total Customers</div>
            <div className="stat-value">{totalCustomers}</div>
          </div>

          <div className="stat-card success">
            <div className="stat-label">Repeat Customers</div>
            <div className="stat-value">{repeatCustomers}</div>
          </div>

          <div className="stat-card info">
            <div className="stat-label">Repeat Rate</div>
            <div className="stat-value">{repeatRate.toFixed(1)}%</div>
          </div>

          <div className="stat-card warning">
            <div className="stat-label">Orders per Customer</div>
            <div className="stat-value">
              {totalCustomers > 0 ? (totalOrders / totalCustomers).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
