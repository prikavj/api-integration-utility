import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import ApiIntegrations from '../components/ApiIntegrations';
import { ApiIntegrationBuilder } from '../components/ApiIntegrationBuilder';
import { Box, Container, Typography, Button } from '@mui/material';

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
  const [activeMenu, setActiveMenu] = useState('api-integration-utility');
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
    { id: 'api-integration-utility', label: 'API Integration Utility', icon: '🔧' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'integration-builder', label: 'Integration Builder', icon: '⚙️' },
    { id: 'api-integrations', label: 'API Integrations', icon: '🔌' },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'api-integration-utility':
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
              Welcome to API Integration Utility
            </h2>
            <Typography variant="body1" paragraph>
              This utility helps you create and manage API integrations. You can:
            </Typography>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>👤</span>
                <div>
                  <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>Manage Your Profile</Typography>
                  <Typography variant="body2" color="text.secondary">View and update your account information</Typography>
                </div>
              </li>
              <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>⚙️</span>
                <div>
                  <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>Build Integrations</Typography>
                  <Typography variant="body2" color="text.secondary">Create new API integrations with a visual builder</Typography>
                </div>
              </li>
              <li style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🔌</span>
                <div>
                  <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>Manage Integrations</Typography>
                  <Typography variant="body2" color="text.secondary">View, edit, and execute your API integrations</Typography>
                </div>
              </li>
            </ul>
          </div>
        );
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
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          padding: '0.5rem',
          borderBottom: '2px solid #2a5298',
          color: '#ffffff',
          textAlign: 'center'
        }}>
          API Integration Utility
        </h1>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '0.75rem 1rem',
                backgroundColor: activeMenu === item.id ? '#2a5298' : 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (activeMenu !== item.id) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }
              }}
              onMouseOut={(e) => {
                if (activeMenu !== item.id) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }
              }}
            >
              <span style={{ 
                marginRight: '0.75rem', 
                fontSize: '1.25rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '0.25rem',
                borderRadius: '4px'
              }}>
                {item.icon}
              </span>
              <span style={{ fontWeight: activeMenu === item.id ? '600' : '400' }}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1 }}>
        {/* Header */}
        <header style={{
          backgroundColor: 'white',
          padding: '1rem 2rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <Button
            onClick={() => window.open('http://localhost:5001/swagger', '_blank')}
            variant="contained"
            color="primary"
            startIcon={<span>📚</span>}
            sx={{
              backgroundColor: '#2563eb',
              '&:hover': {
                backgroundColor: '#1d4ed8'
              }
            }}
          >
            API Docs
          </Button>
          <Button
            onClick={handleLogout}
            variant="contained"
            color="error"
            startIcon={<span>🚪</span>}
            sx={{
              backgroundColor: '#ef4444',
              '&:hover': {
                backgroundColor: '#dc2626'
              }
            }}
          >
            Logout
          </Button>
        </header>

        {/* Content */}
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