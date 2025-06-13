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
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiEndpoints, ApiEndpoint } from '../services/api';

interface ApiIntegrationBuilderProps {
  onSave: (name: string, connections: { apiEndpointId: number; sequenceNumber: number }[]) => void;
}

const ApiIntegrationBuilder: React.FC<ApiIntegrationBuilderProps> = ({ onSave }) => {
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [integrationName, setIntegrationName] = useState('');
  const [connections, setConnections] = useState<{ apiEndpointId: number; sequenceNumber: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSave = () => {
    if (!integrationName.trim()) {
      setError('Please enter an integration name');
      return;
    }
    if (connections.length === 0) {
      setError('Please add at least one API endpoint');
      return;
    }
    onSave(integrationName, connections);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Create API Integration
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
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

        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={loading || connections.length === 0 || !integrationName.trim()}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Save Integration'}
        </Button>
      </Paper>
    </Box>
  );
};

export default ApiIntegrationBuilder; 