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
  SelectChangeEvent
} from '@mui/material';
import { apiEndpoints, ApiEndpoint } from '../services/api';

const ApiIntegrations: React.FC = () => {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  useEffect(() => {
    fetchEndpoints();
  }, []);

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

  const handleEndpointChange = (event: SelectChangeEvent<number>) => {
    const endpointId = event.target.value as number;
    const endpoint = endpoints.find(ep => ep.id === endpointId) || null;
    setSelectedEndpoint(endpoint);
    setApiResponse(null);
    setResponseTime(null);
  };

  const handleRunApi = async () => {
    if (!selectedEndpoint) return;

    try {
      setLoading(true);
      setError(null);
      setApiResponse(null);
      setResponseTime(null);

      const startTime = performance.now();
      const response = await apiEndpoints.execute(selectedEndpoint);
      const endTime = performance.now();

      setApiResponse(response.data);
      setResponseTime(endTime - startTime);
    } catch (err: any) {
      console.error('Error executing API:', err);
      setError(err.response?.data?.message || 'Failed to execute API');
      setApiResponse(err.response?.data || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        API Integrations
      </Typography>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select API Endpoint</InputLabel>
        <Select
          value={selectedEndpoint?.id || ''}
          onChange={handleEndpointChange}
          label="Select API Endpoint"
        >
          {endpoints.map((endpoint) => (
            <MenuItem key={endpoint.id} value={endpoint.id}>
              {endpoint.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedEndpoint && (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Property</TableCell>
                <TableCell>Value</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>{selectedEndpoint.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>URL</TableCell>
                <TableCell>{selectedEndpoint.url}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Method</TableCell>
                <TableCell>
                  <Chip 
                    label={selectedEndpoint.method} 
                    color={
                      selectedEndpoint.method === 'GET' ? 'success' :
                      selectedEndpoint.method === 'POST' ? 'primary' :
                      selectedEndpoint.method === 'PUT' ? 'warning' :
                      selectedEndpoint.method === 'DELETE' ? 'error' : 'default'
                    }
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>{selectedEndpoint.description}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>{selectedEndpoint.category}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {selectedEndpoint && (
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleRunApi}
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Run API'}
          </Button>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {apiResponse && (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                API Response
              </Typography>
              {responseTime && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Response Time: {responseTime.toFixed(2)}ms
                </Typography>
              )}
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '1rem', 
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '300px'
              }}>
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ApiIntegrations; 