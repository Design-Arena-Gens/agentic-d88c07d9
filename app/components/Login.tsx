'use client';

import { useState } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../data/storage';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }

    const users = storage.getUsers();
    let user = users.find(u => u.username === username && u.role === role);

    if (!user) {
      // Create new user if not exists
      user = {
        id: Date.now().toString(),
        username,
        role,
        name: username,
      };
    }

    onLogin(user);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Khakhra Business Manager</h1>
        <p>Complete Management System</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="accountant">Accountant</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            Login
          </button>
        </form>

        <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', fontSize: '13px' }}>
          <strong>Demo Credentials:</strong><br/>
          Username: <code>admin</code> | Role: <code>Admin</code><br/>
          Username: <code>staff</code> | Role: <code>Staff</code><br/>
          Username: <code>accountant</code> | Role: <code>Accountant</code>
        </div>
      </div>
    </div>
  );
}
