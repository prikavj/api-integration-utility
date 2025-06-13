import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

interface ApiIntegration {
  id: number;
  name: string;
  connections: Array<{
    apiEndpointId: number;
    sequenceNumber: number;
  }>;
}

export const ApiIntegrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);

  useEffect(() => {
    const fetchIntegrations = async () => {
      const response = await api.get('/api/apiintegrations');
      setIntegrations(response.data);
    };
    fetchIntegrations();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">API Integrations</h1>
      <div className="grid gap-4">
        {integrations.map((integration) => (
          <div key={integration.id} className="border p-4 rounded shadow">
            <h2 className="text-xl font-semibold">{integration.name}</h2>
            <p>Connections: {integration.connections.length}</p>
            <Link to={`/builder/${integration.id}`} className="text-blue-500 hover:underline">
              Load
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}; 