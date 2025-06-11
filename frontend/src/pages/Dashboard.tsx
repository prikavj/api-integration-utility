import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  setIsAuthenticated: (value: boolean) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'help', label: 'Help & Support', icon: '❓' },
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f3f4f6'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        backgroundColor: '#1e3c72',
        color: 'white',
        padding: '1rem'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '2rem',
          padding: '1rem'
        }}>
          API Integration
        </h1>
        <nav>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '0.75rem 1rem',
                marginBottom: '0.5rem',
                backgroundColor: activeMenu === item.id ? '#2a5298' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <span style={{ marginRight: '0.75rem', fontSize: '1.25rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        {/* Header */}
        <header style={{
          backgroundColor: 'white',
          padding: '1rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </header>

        {/* Main Content Area */}
        <main style={{ padding: '2rem' }}>
          {/* Welcome Section */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '10px',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#1e3c72'
            }}>
              Welcome to Your Dashboard
            </h2>
            <p style={{ color: '#6b7280' }}>
              Manage your API integrations and monitor your system's performance from this central hub.
            </p>
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <StatCard
              title="API Calls"
              value="1,234"
              subtitle="Last 24 hours"
              color="#1e3c72"
            />
            <StatCard
              title="Success Rate"
              value="99.9%"
              subtitle="Average"
              color="#2563eb"
            />
            <StatCard
              title="Active Users"
              value="256"
              subtitle="Current"
              color="#7c3aed"
            />
          </div>

          {/* Recent Activity */}
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              marginBottom: '1.5rem',
              color: '#1e3c72'
            }}>
              Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px'
                  }}
                >
                  <p style={{ color: '#374151' }}>API Integration {i} completed successfully</p>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>2 hours ago</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, color }) => (
  <div style={{
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '10px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    borderTop: `4px solid ${color}`
  }}>
    <h3 style={{
      fontSize: '1.125rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      color: color
    }}>
      {title}
    </h3>
    <p style={{
      fontSize: '1.875rem',
      fontWeight: 'bold',
      color: '#111827'
    }}>
      {value}
    </p>
    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>{subtitle}</p>
  </div>
);

export default Dashboard; 