import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';

interface LoginProps {
  setIsAuthenticated: (value: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setIsLoading(true);
      await authApi.login({ username, password });
      sessionStorage.setItem('isLoggedIn', 'true');
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        margin: '1rem'
      }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '0.5rem',
          color: '#1e3c72'
        }}>
          API Integration Utility
        </h2>
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '2rem'
        }}>
          Sign in to your account
        </p>

        {location.state?.message && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#d1fae5',
            borderRadius: '8px',
            color: '#065f46'
          }}>
            {location.state.message}
          </div>
        )}

        {error && (
          <div style={{
            padding: '1rem',
            marginBottom: '1rem',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            color: '#991b1b'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#374151',
              fontWeight: '500'
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              placeholder="Enter your username"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#374151',
              fontWeight: '500'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#1e3c72',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              opacity: isLoading ? '0.7' : '1',
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          <div style={{
            marginTop: '1rem',
            textAlign: 'center',
            color: '#6b7280'
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: '#1e3c72',
              textDecoration: 'none',
              fontWeight: '500'
            }}>
              Create one now
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 