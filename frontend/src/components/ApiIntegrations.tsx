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
  Stack
} from '@mui/material';
import { apiIntegrations, ApiIntegration, apiEndpoints, ApiEndpoint } from '../services/api';

const ApiIntegrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<ApiIntegration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);

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

  const handleIntegrationChange = (event: SelectChangeEvent<number>) => {
    const integrationId = event.target.value as number;
    const integration = integrations.find(i => i.id === integrationId) || null;
    setSelectedIntegration(integration);
    setExecutionResult(null);
  };

  const handleExecuteIntegration = async () => {
    if (!selectedIntegration) return;

    try {
      setLoading(true);
      setError(null);
      const result = await apiIntegrations.execute(selectedIntegration.id);
      setExecutionResult(result);
    } catch (err: any) {
      console.error('Error executing integration:', err);
      setError(err.response?.data?.message || 'Failed to execute integration');
    } finally {
      setLoading(false);
    }
  };

  const getEndpointDetails = (endpointId: number) => {
    return endpoints.find(ep => ep.id === endpointId);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Funny API Integrations
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
            onChange={handleIntegrationChange}
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
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedIntegration.connections
                  .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
                  .map((connection) => {
                    const endpoint = getEndpointDetails(connection.apiEndpointId);
                    return endpoint ? (
                      <TableRow key={connection.apiEndpointId}>
                        <TableCell>{connection.sequenceNumber}</TableCell>
                        <TableCell>{endpoint.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={endpoint.method} 
                            color={
                              endpoint.method === 'GET' ? 'success' :
                              endpoint.method === 'POST' ? 'primary' :
                              endpoint.method === 'PUT' ? 'warning' :
                              endpoint.method === 'DELETE' ? 'error' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>{endpoint.url}</TableCell>
                      </TableRow>
                    ) : null;
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleExecuteIntegration}
              disabled={loading}
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
                      <TableCell>Status</TableCell>
                      <TableCell>Response Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {executionResult.steps.map((step: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Chip 
                            label={step.statusCode} 
                            color={step.statusCode >= 200 && step.statusCode < 300 ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>{step.runTime.toFixed(2)}ms</TableCell>
                      </TableRow>
                    ))}
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

export default ApiIntegrations; 