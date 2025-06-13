import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import ApiIntegrations from '../components/ApiIntegrations';
import { ApiIntegrationBuilder } from '../components/ApiIntegrationBuilder';
import { Box, Container, Typography } from '@mui/material';

interface DashboardProps {
  setIsAuthenticated: (value: boolean) => void;
}

interface UserProfile {
  id: number;
  username: string;
  createdAt: string;
}

const Dashboard: React.FC<DashboardProps> = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('profile');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const data = await authApi.getProfile();
      setUserProfile(data);
    } catch (err) {
      setError('Failed to load user profile');
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    setIsAuthenticated(false);
    navigate('/login');
  };

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'integration-builder', label: 'Integration Builder', icon: '⚙️' },
    { id: 'api-integrations', label: 'API Integrations', icon: '🔌' },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'profile':
        return (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '10px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.875rem',
              fontWeight: 'bold',
              marginBottom: '2rem',
              color: '#1e3c72'
            }}>
              User Profile
            </h2>
            {loading && (
              <p style={{ color: '#6b7280' }}>Loading profile...</p>
            )}
            {error && (
              <div style={{
                padding: '1rem',
                backgroundColor: '#fee2e2',
                borderRadius: '8px',
                color: '#991b1b',
                marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}
            {userProfile && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ color: '#64748b', fontSize: '0.875rem' }}>Username</label>
                    <p style={{ color: '#1e293b', fontSize: '1.125rem', fontWeight: '500' }}>
                      {userProfile.username}
                    </p>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ color: '#64748b', fontSize: '0.875rem' }}>User ID</label>
                    <p style={{ color: '#1e293b', fontSize: '1.125rem', fontWeight: '500' }}>
                      {userProfile.id}
                    </p>
                  </div>
                  <div>
                    <label style={{ color: '#64748b', fontSize: '0.875rem' }}>Member Since</label>
                    <p style={{ color: '#1e293b', fontSize: '1.125rem', fontWeight: '500' }}>
                      {new Date(userProfile.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'api-integrations':
        return <ApiIntegrations />;
      case 'integration-builder':
        return <ApiIntegrationBuilder />;
      default:
        return null;
    }
  };

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
          justifyContent: 'flex-end',
          gap: '1rem'
        }}>
          <button
            onClick={() => window.open('http://localhost:5001/swagger', '_blank')}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span>📚</span>
            Endpoints Swagger
          </button>
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
          {renderContent()}
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