import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response || error);
    return Promise.reject(error);
  }
);

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  message: string;
}

export interface ApiEndpoint {
  id: number;
  name: string;
  url: string;
  method: string;
  description: string;
  category: string;
  createdAt: string;
}

export interface ApiIntegration {
  id: number;
  name: string;
  createdAt: string;
  lastModifiedAt: string | null;
  connections: Array<{
    apiEndpointId: number;
    sequenceNumber: number;
  }>;
}

export interface ApiIntegrationConnection {
  id: number;
  apiIntegrationId: number;
  apiEndpointId: number;
  sequenceNumber: number;
}

export interface ExecutionRequest {
  parameters: Record<string, string>;
}

export const authApi = {
  register: async (data: RegisterRequest) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  login: async (data: LoginRequest) => {
    const response = await api.post<LoginResponse>('/api/auth/login', data);
    // Store the token in sessionStorage
    sessionStorage.setItem('token', response.data.token);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('isLoggedIn');
  }
};

export const apiEndpoints = {
  getAll: async () => {
    const response = await api.get<ApiEndpoint[]>('/api/apiendpoints');
    return response.data;
  },

  execute: async (endpoint: ApiEndpoint) => {
    const method = endpoint.method.toLowerCase();
    const url = endpoint.url.startsWith('http') ? endpoint.url : `${api.defaults.baseURL}${endpoint.url}`;
    
    console.log('Executing API endpoint:', { method, url });
    
    const response = await api({
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    return response;
  }
};

export const apiIntegrations = {
  create: async (name: string, connections: { apiEndpointId: number; sequenceNumber: number }[]) => {
    const response = await api.post<ApiIntegration>('/api/apiintegrations', {
      name,
      connections
    });
    return response.data;
  },

  getAll: async () => {
    const response = await api.get<ApiIntegration[]>('/api/apiintegrations');
    return response.data;
  },

  execute: async (id: number, token?: string, parameters?: Record<string, string>, requestBodies?: Record<number, any>) => {
    console.log('Executing integration:', { id, token, parameters, requestBodies });
    const response = await api.post(`/api/apiintegrations/${id}/execute`, 
      {
        parameters,
        requestBodies,
        token
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Execution response:', response.data);
    return response.data;
  }
};

export { api }; 