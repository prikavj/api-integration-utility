import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiEndpoints, ApiEndpoint, apiIntegrations, ApiIntegration } from '../services/api';
import { api } from '../services/api';

interface ApiIntegrationBuilderProps {
  integrationId?: number;
}

interface ExecutionResult {
  integrationId: number;
  steps: Array<{
    apiEndpointId: number;
    statusCode: number;
    runTime: number;
  }>;
}

export const ApiIntegrationBuilder: React.FC<ApiIntegrationBuilderProps> = ({ integrationId }) => {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [integrationName, setIntegrationName] = useState('');
  const [connections, setConnections] = useState<{ apiEndpointId: number; sequenceNumber: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [integration, setIntegration] = useState<ApiIntegration | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<number | ''>('');

  useEffect(() => {
    fetchEndpoints();
    fetchIntegrations();
    if (integrationId) {
      const fetchIntegration = async () => {
        const response = await api.get(`/api/apiintegrations/${integrationId}`);
        setIntegration(response.data);
      };
      fetchIntegration();
    }
  }, [integrationId]);

  const fetchEndpoints = async () => {
    try {
      setLoading(true);
      const data = await apiEndpoints.getAll();
      setEndpoints(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching endpoints:', err);
      setError('Failed to fetch API endpoints');
    } finally {
      setLoading(false);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const data = await apiIntegrations.getAll();
      setIntegrations(data);
    } catch (err) {
      console.error('Error fetching integrations:', err);
      setError('Failed to fetch integrations');
    }
  };

  const handleIntegrationSelect = (integrationId: number) => {
    const selectedIntegration = integrations.find(i => i.id === integrationId);
    if (selectedIntegration) {
      setIntegrationName(selectedIntegration.name);
      setConnections(selectedIntegration.connections.map(conn => ({
        apiEndpointId: conn.apiEndpointId,
        sequenceNumber: conn.sequenceNumber
      })));
      setSelectedIntegrationId(integrationId);
    }
  };

  const handleDeleteIntegration = async () => {
    if (!selectedIntegrationId) return;

    try {
      setLoading(true);
      await api.delete(`/api/apiintegrations/${selectedIntegrationId}`);
      setSuccessMessage('Integration deleted successfully');
      setIntegrationName('');
      setConnections([]);
      setSelectedIntegrationId('');
      fetchIntegrations();
    } catch (err) {
      setError('Failed to delete integration');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEndpoint = () => {
    if (selectedEndpoint) {
      setConnections([
        ...connections,
        {
          apiEndpointId: selectedEndpoint.id,
          sequenceNumber: connections.length + 1
        }
      ]);
      setSelectedEndpoint(null);
    }
  };

  const handleRemoveEndpoint = (index: number) => {
    setConnections(connections.filter((_, i) => i !== index).map((conn, i) => ({
      ...conn,
      sequenceNumber: i + 1
    })));
  };

  const handleSave = async () => {
    if (!integrationName.trim()) {
      setError('Please enter an integration name');
      return;
    }
    if (connections.length === 0) {
      setError('Please add at least one API endpoint');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const connectionsWithSequence = connections.map((conn, index) => ({
        apiEndpointId: conn.apiEndpointId,
        sequenceNumber: index + 1
      }));

      if (selectedIntegrationId) {
        // Update existing integration
        await api.put(`/api/apiintegrations/${selectedIntegrationId}`, {
          name: integrationName,
          connections: connectionsWithSequence
        });
        setSuccessMessage('Integration updated successfully!');
      } else {
        // Create new integration
        await api.post('/api/apiintegrations', {
          name: integrationName,
          connections: connectionsWithSequence
        });
        setSuccessMessage('Integration saved successfully!');
      }

      setIntegrationName('');
      setConnections([]);
      setSelectedIntegrationId('');
      fetchIntegrations();
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.includes('already exists')) {
        setError('An integration with this name already exists');
      } else {
        setError('Failed to save integration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    if (integrationId) {
      const response = await api.post(`/api/apiintegrations/${integrationId}/execute`);
      setExecutionResult(response.data);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {selectedIntegrationId ? 'Edit Integration' : 'Create API Integration'}
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Existing Integration</InputLabel>
          <Select
            value={selectedIntegrationId}
            onChange={(e) => handleIntegrationSelect(e.target.value as number)}
            label="Select Existing Integration"
          >
            <MenuItem value="">
              <em>Create New Integration</em>
            </MenuItem>
            {integrations.map((integration) => (
              <MenuItem key={integration.id} value={integration.id}>
                {integration.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Integration Name"
          value={integrationName}
          onChange={(e) => setIntegrationName(e.target.value)}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select API Endpoint</InputLabel>
          <Select
            value={selectedEndpoint?.id || ''}
            onChange={(e) => {
              const endpoint = endpoints.find(ep => ep.id === e.target.value);
              setSelectedEndpoint(endpoint || null);
            }}
            label="Select API Endpoint"
          >
            {endpoints.map((endpoint) => (
              <MenuItem key={endpoint.id} value={endpoint.id}>
                {endpoint.name} ({endpoint.method} {endpoint.url})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={handleAddEndpoint}
          disabled={!selectedEndpoint}
          sx={{ mb: 2 }}
        >
          Add Endpoint
        </Button>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        <Typography variant="h6" gutterBottom>
          Integration Flow
        </Typography>

        <List>
          {connections.map((conn, index) => {
            const endpoint = endpoints.find(ep => ep.id === conn.apiEndpointId);
            return (
              <ListItem key={index}>
                <ListItemText
                  primary={`${index + 1}. ${endpoint?.name}`}
                  secondary={`${endpoint?.method} ${endpoint?.url}`}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleRemoveEndpoint(index)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>

        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={loading || connections.length === 0 || !integrationName.trim()}
          >
            {loading ? <CircularProgress size={24} /> : (selectedIntegrationId ? 'Update Integration' : 'Save Integration')}
          </Button>
          
          {selectedIntegrationId && (
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteIntegration}
              disabled={loading}
            >
              Delete Integration
            </Button>
          )}
        </Stack>

        {integration && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold">{integration.name}</h2>
            <p>Connections: {integration.connections.length}</p>
            <button onClick={handleRun} className="bg-green-500 text-white px-4 py-2 rounded mt-4">
              Run
            </button>
            {executionResult && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Execution Results</h3>
                {executionResult.steps.map((step, index) => (
                  <div key={index} className="border p-2 mt-2">
                    <p>Step {index + 1}: Status Code {step.statusCode}</p>
                    <p>Run Time: {step.runTime}ms</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Paper>
    </Box>
  );
};

export default ApiIntegrationBuilder; 