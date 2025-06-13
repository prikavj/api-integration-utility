import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Chip,
  SelectChangeEvent,
  Stack,
  TextField,
  Container,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { apiIntegrations, ApiIntegration, apiEndpoints, ApiEndpoint } from '../services/api';

const API_BASE_URL = 'http://localhost:5001';

const ApiIntegrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<ApiIntegration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [token, setToken] = useState<string>(sessionStorage.getItem('token') || '');
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [newIntegrationName, setNewIntegrationName] = useState('');
  const [selectedEndpoints, setSelectedEndpoints] = useState<{ apiEndpointId: number; sequenceNumber: number }[]>([]);
  const [endpointParameters, setEndpointParameters] = useState<Record<number, Record<string, string>>>({});
  const [openDialog, setOpenDialog] = useState(false);
  const [requestBodies, setRequestBodies] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchIntegrations();
    fetchEndpoints();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const data = await apiIntegrations.getAll();
      setIntegrations(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching integrations:', err);
      setError('Failed to fetch API integrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchEndpoints = async () => {
    try {
      const data = await apiEndpoints.getAll();
      setEndpoints(data);
    } catch (err) {
      console.error('Error fetching endpoints:', err);
    }
  };

  const handleSelectIntegration = (integration: ApiIntegration) => {
    setSelectedIntegration(integration);
    setExecutionResult(null);
  };

  const getEndpointParameters = (url: string) => {
    const matches = url.match(/\{([^}]+)\}/g) || [];
    return matches.map(match => match.slice(1, -1));
  };

  const handleParameterChange = (endpointId: number, paramName: string, value: string) => {
    setEndpointParameters(prev => ({
      ...prev,
      [endpointId]: {
        ...(prev[endpointId] || {}),
        [paramName]: value
      }
    }));
  };

  const handleRequestBodyChange = (endpointId: number, value: string) => {
    setRequestBodies(prev => ({
      ...prev,
      [endpointId]: value
    }));
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleCreateIntegration = async () => {
    if (!newIntegrationName || selectedEndpoints.length === 0) return;

    try {
      setLoading(true);
      setError(null);
      const integration = await apiIntegrations.create(newIntegrationName, selectedEndpoints);
      setIntegrations(prev => [...prev, integration]);
      setNewIntegrationName('');
      setSelectedEndpoints([]);
      setEndpointParameters({});
    } catch (err: any) {
      console.error('Error creating integration:', err);
      setError(err.response?.data?.message || 'Failed to create integration');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteIntegration = async () => {
    if (!selectedIntegration) {
      console.log('Cannot execute: missing integration');
      return;
    }

    if (!token) {
      setError('Please enter a token to execute integrations');
      return;
    }

    setLoading(true);
    setExecutionResult(null);
    setError(null);

    try {
      console.log('Starting integration execution...');
      console.log('Integration:', selectedIntegration);
      
      // Collect all parameters from the selected integration's endpoints
      const allParameters: Record<string, string> = {};
      const allRequestBodies: Record<number, any> = {};
      
      selectedIntegration.connections.forEach(conn => {
        const endpointParams = endpointParameters[conn.apiEndpointId] || {};
        Object.assign(allParameters, endpointParams);
        
        // Add request body if it exists
        const requestBody = requestBodies[conn.apiEndpointId];
        if (requestBody) {
          try {
            allRequestBodies[conn.apiEndpointId] = JSON.parse(requestBody);
          } catch (e) {
            console.error('Invalid JSON in request body:', e);
            setError('Invalid JSON in request body');
            return;
          }
        }
      });
      
      console.log('Parameters:', allParameters);
      console.log('Request Bodies:', allRequestBodies);

      const result = await apiIntegrations.execute(selectedIntegration.id, token, allParameters, allRequestBodies);
      console.log('Execution result:', result);
      setExecutionResult(result);
    } catch (err: any) {
      console.error('Error executing integration:', err);
      setError(err.response?.data?.message || 'Failed to execute integration');
    } finally {
      setLoading(false);
    }
  };

  const getRequiredParameters = () => {
    if (!selectedIntegration) return [];
    
    const params = new Set<string>();
    selectedIntegration.connections.forEach(conn => {
      const endpoint = getEndpointDetails(conn.apiEndpointId);
      if (endpoint) {
        const matches = endpoint.url.match(/\{([^}]+)\}/g) || [];
        matches.forEach(match => {
          const paramName = match.slice(1, -1);
          params.add(paramName);
        });
      }
    });
    return Array.from(params);
  };

  const getEndpointDetails = (endpointId: number) => {
    return endpoints.find(ep => ep.id === endpointId);
  };

  const handleAddEndpoint = (endpoint: ApiEndpoint) => {
    setSelectedEndpoints(prev => [
      ...prev,
      {
        apiEndpointId: endpoint.id,
        sequenceNumber: prev.length + 1
      }
    ]);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        API Integrations
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="integration-select-label">Select Integration</InputLabel>
          <Select
            labelId="integration-select-label"
            id="integration-select"
            value={selectedIntegration?.id || ''}
            label="Select Integration"
            onChange={(e) => handleSelectIntegration(integrations.find(i => i.id === e.target.value)!)}
          >
            {integrations.map((integration) => (
              <MenuItem key={integration.id} value={integration.id}>
                {integration.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {selectedIntegration && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Integration Details</Typography>
          <Typography>Name: {selectedIntegration.name}</Typography>
          <Typography>Created At: {new Date(selectedIntegration.createdAt).toLocaleString()}</Typography>
          <Typography>Last Modified: {selectedIntegration.lastModifiedAt ? new Date(selectedIntegration.lastModifiedAt).toLocaleString() : 'N/A'}</Typography>
          <Typography>Connections: {selectedIntegration.connections.length}</Typography>
        </Box>
      )}

      {selectedIntegration && (
        <>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Sequence</TableCell>
                  <TableCell>API Endpoint</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell>Parameters</TableCell>
                  <TableCell>Request Body</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedIntegration.connections
                  .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
                  .map((connection) => {
                    const endpoint = getEndpointDetails(connection.apiEndpointId);
                    if (!endpoint) return null;
                    const params = getEndpointParameters(endpoint.url);
                    const isPostOrPut = endpoint.method === 'POST' || endpoint.method === 'PUT';
                    
                    return (
                      <TableRow key={`${connection.apiEndpointId}-${connection.sequenceNumber}`}>
                        <TableCell>{connection.sequenceNumber}</TableCell>
                        <TableCell>{endpoint.name}</TableCell>
                        <TableCell>{endpoint.method}</TableCell>
                        <TableCell>{endpoint.url}</TableCell>
                        <TableCell>
                          {params.map(param => (
                            <TextField
                              key={param}
                              label={param}
                              value={endpointParameters[connection.apiEndpointId]?.[param] || ''}
                              onChange={(e) => handleParameterChange(connection.apiEndpointId, param, e.target.value)}
                              size="small"
                              sx={{ mb: 1, width: '100%' }}
                            />
                          ))}
                        </TableCell>
                        <TableCell>
                          {isPostOrPut && (
                            <TextField
                              label="Request Body (JSON)"
                              multiline
                              rows={4}
                              value={requestBodies[connection.apiEndpointId] || ''}
                              onChange={(e) => handleRequestBodyChange(connection.apiEndpointId, e.target.value)}
                              size="small"
                              sx={{ width: '100%' }}
                              placeholder="Enter JSON request body"
                              error={!!requestBodies[connection.apiEndpointId] && !isValidJson(requestBodies[connection.apiEndpointId])}
                              helperText={!!requestBodies[connection.apiEndpointId] && !isValidJson(requestBodies[connection.apiEndpointId]) ? 'Invalid JSON' : ''}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" spacing={2}>
            <TextField
              label="Token"
              type="password"
              value={token}
              onChange={(e) => {
                const newToken = e.target.value;
                setToken(newToken);
                sessionStorage.setItem('token', newToken);
              }}
              sx={{ mb: 2, width: '300px' }}
              placeholder="Enter your API token"
              helperText="Token will be masked for security"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                console.log('Execute button clicked');
                handleExecuteIntegration();
              }}
              disabled={loading || !token}
            >
              {loading ? <CircularProgress size={24} /> : 'Execute Integration'}
            </Button>
          </Stack>

          {executionResult && (
            <Paper sx={{ mt: 3, p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Execution Results
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Step</TableCell>
                      <TableCell>API Endpoint</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Response Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {executionResult.steps.map((step: any, index: number) => {
                      const endpoint = getEndpointDetails(step.apiEndpointId);
                      return (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{endpoint ? endpoint.name : 'Unknown'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={endpoint ? endpoint.method : 'Unknown'} 
                              color={
                                endpoint?.method === 'GET' ? 'success' :
                                endpoint?.method === 'POST' ? 'primary' :
                                endpoint?.method === 'PUT' ? 'warning' :
                                endpoint?.method === 'DELETE' ? 'error' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={step.statusCode} 
                              color={step.statusCode >= 200 && step.statusCode < 300 ? 'success' : 'error'}
                            />
                          </TableCell>
                          <TableCell>{step.runTime.toFixed(2)}ms</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

// Helper function to validate JSON
const isValidJson = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

export default ApiIntegrations; 