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
import { apiIntegrations, apiEndpoints, ApiIntegration, ApiEndpoint, ExecutionResult } from '../services/api';

const API_BASE_URL = 'http://localhost:5001';

const ApiIntegrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<ApiIntegration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [token, setToken] = useState<string>(sessionStorage.getItem('token') || '');
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [newIntegrationName, setNewIntegrationName] = useState('');
  const [selectedEndpoints, setSelectedEndpoints] = useState<{ apiEndpointId: number; sequenceNumber: number }[]>([]);
  const [endpointParameters, setEndpointParameters] = useState<Record<number, Record<string, string>>>({});
  const [openDialog, setOpenDialog] = useState(false);
  const [requestBodies, setRequestBodies] = useState<Record<number, string>>({});
  const [requestBodyErrors, setRequestBodyErrors] = useState<Record<number, string>>({});

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

  const handleIntegrationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const integrationId = parseInt(event.target.value, 10);
    const integration = integrations.find(i => i.id === integrationId);
    if (integration) {
      setSelectedIntegration(integration);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Left sidebar */}
      <Box sx={{ 
        width: 300, 
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 'bold', 
          mb: 2,
          color: 'primary.main',
          borderBottom: '2px solid',
          borderColor: 'primary.main',
          pb: 1
        }}>
          API Integration Utility
        </Typography>
        
        <TextField
          select
          label="Select Integration"
          value={selectedIntegration?.id || ''}
          onChange={handleIntegrationChange}
          fullWidth
          sx={{ mb: 2 }}
        >
          {integrations.map((integration) => (
            <MenuItem key={integration.id} value={integration.id.toString()}>
              {integration.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Token"
          value={token}
          onChange={(e) => {
            const newToken = e.target.value;
            setToken(newToken);
            sessionStorage.setItem('token', newToken);
          }}
          fullWidth
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          onClick={handleExecuteIntegration}
          disabled={!selectedIntegration || !token || loading}
          fullWidth
          sx={{ mb: 2 }}
        >
          {loading ? 'Executing...' : 'Execute Integration'}
        </Button>

        {selectedIntegration && (
          <Box sx={{ 
            mt: 2,
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="subtitle1" gutterBottom>
              Integration Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Created: {new Date(selectedIntegration.createdAt).toLocaleString()}
            </Typography>
            {selectedIntegration.lastModifiedAt && (
              <Typography variant="body2" color="text.secondary">
                Last Modified: {new Date(selectedIntegration.lastModifiedAt).toLocaleString()}
              </Typography>
            )}
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        {selectedIntegration && (
          <>
            <Typography variant="h5" gutterBottom>
              {selectedIntegration.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Created: {new Date(selectedIntegration.createdAt).toLocaleString()}
            </Typography>

            {selectedIntegration.connections.map((connection, index) => {
              const endpoint = getEndpointDetails(connection.apiEndpointId);
              if (!endpoint) return null;

              return (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {endpoint.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {endpoint.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Method: {endpoint.method}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    URL: {endpoint.url}
                  </Typography>

                  {/* Parameters */}
                  {getEndpointParameters(endpoint.url).length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Parameters
                      </Typography>
                      {getEndpointParameters(endpoint.url).map((paramName) => (
                        <TextField
                          key={paramName}
                          label={paramName}
                          value={endpointParameters[endpoint.id]?.[paramName] || ''}
                          onChange={(e) => handleParameterChange(endpoint.id, paramName, e.target.value)}
                          fullWidth
                          margin="normal"
                          size="small"
                        />
                      ))}
                    </Box>
                  )}

                  {/* Request Body */}
                  {endpoint.method === 'POST' || endpoint.method === 'PUT' ? (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Request Body
                      </Typography>
                      <TextField
                        multiline
                        rows={4}
                        value={requestBodies[endpoint.id] || ''}
                        onChange={(e) => handleRequestBodyChange(endpoint.id, e.target.value)}
                        fullWidth
                        placeholder="Enter JSON request body"
                        error={!!requestBodyErrors[endpoint.id]}
                        helperText={requestBodyErrors[endpoint.id] || 'Enter valid JSON'}
                      />
                    </Box>
                  ) : null}
                </Paper>
              );
            })}

            {executionResult && (
              <Paper sx={{ mt: 3, p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Execution Results
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Endpoint ID</TableCell>
                        <TableCell>Status Code</TableCell>
                        <TableCell>Execution Time</TableCell>
                        <TableCell>Response</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {executionResult.results.map((result: any, index: number) => {
                        const endpoint = getEndpointDetails(result.endpointId);
                        return (
                          <TableRow key={index}>
                            <TableCell>{endpoint ? endpoint.name : 'Unknown'}</TableCell>
                            <TableCell>
                              <Chip 
                                label={result.statusCode} 
                                color={result.statusCode >= 200 && result.statusCode < 300 ? 'success' : 'error'}
                              />
                            </TableCell>
                            <TableCell>{result.executionTimeMs || 0}ms</TableCell>
                            <TableCell>
                              <Box sx={{ 
                                maxWidth: '600px',
                                overflowX: 'auto',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '4px',
                                padding: '8px',
                                '& pre': {
                                  margin: 0,
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                  fontFamily: 'monospace',
                                  fontSize: '14px',
                                  maxHeight: '200px',
                                  overflowY: 'auto',
                                  overflowX: 'auto'
                                }
                              }}>
                                <pre>
                                  {typeof result.response === 'string' 
                                    ? result.response 
                                    : JSON.stringify(result.response, null, 2)}
                                </pre>
                              </Box>
                            </TableCell>
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