'use client';

import { useState } from 'react';
import { User, UserRole } from '../types';
import OrdersTab from './tabs/OrdersTab';
import InventoryTab from './tabs/InventoryTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import ExpensesTab from './tabs/ExpensesTab';
import ProfitLossTab from './tabs/ProfitLossTab';
import CustomersTab from './tabs/CustomersTab';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

type Tab = 'orders' | 'inventory' | 'expenses' | 'profitloss' | 'analytics' | 'customers';

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('orders');

  const hasAccess = (tab: Tab): boolean => {
    if (user.role === 'admin') return true;

    const access: Record<UserRole, Tab[]> = {
      admin: ['orders', 'inventory', 'expenses', 'profitloss', 'analytics', 'customers'],
      staff: ['orders', 'inventory', 'customers'],
      accountant: ['orders', 'expenses', 'profitloss', 'analytics'],
    };

    return access[user.role].includes(tab);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'orders', label: 'Orders' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'profitloss', label: 'P&L Reports' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'customers', label: 'Customers' },
  ];

  return (
    <div>
      <div className="header">
        <h1>Khakhra Business Manager</h1>
        <div className="header-right">
          <div className="user-info">
            <span className="user-badge">{user.role.toUpperCase()}</span>
            <span>{user.name}</span>
          </div>
          <button onClick={onLogout} className="btn btn-secondary btn-sm">
            Logout
          </button>
        </div>
      </div>

      <div className="container">
        <div className="nav-tabs">
          {tabs.filter(tab => hasAccess(tab.id)).map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'orders' && <OrdersTab user={user} />}
        {activeTab === 'inventory' && <InventoryTab user={user} />}
        {activeTab === 'expenses' && <ExpensesTab user={user} />}
        {activeTab === 'profitloss' && <ProfitLossTab user={user} />}
        {activeTab === 'analytics' && <AnalyticsTab user={user} />}
        {activeTab === 'customers' && <CustomersTab user={user} />}
      </div>
    </div>
  );
}
