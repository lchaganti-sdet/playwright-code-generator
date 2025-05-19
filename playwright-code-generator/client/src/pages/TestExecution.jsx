import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Alert,
  TextField,
  Switch,
  FormControlLabel,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText as MuiListItemText,
  Divider
} from '@mui/material';
import { PlayArrow, CheckCircle, Error } from '@mui/icons-material';

const TestExecution = () => {
  const [url, setUrl] = useState('');
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [results, setResults] = useState(null);
  const [headed, setHeaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchScenarios = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/scenarios?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      setScenarios(data);
    } catch (error) {
      console.error('Failed to fetch scenarios:', error);
      setError('Failed to fetch test scenarios');
    }
  };

  useEffect(() => {
    if (url) {
      fetchScenarios();
    }
  }, [url]);

  const runTests = async () => {
    try {
      setLoading(true);
      setError(null);
      setResults(null);

      const response = await fetch('http://localhost:3002/api/run-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          selectedScenarios,
          headed,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to run tests');
      }

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Failed to run tests:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Execute Test Scenarios
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Application URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
            placeholder="https://www.example.com"
          />
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={headed}
              onChange={(e) => setHeaded(e.target.checked)}
            />
          }
          label="Run in headed mode"
          sx={{ mb: 3 }}
        />
        {scenarios.length > 0 && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Scenarios</InputLabel>
            <Select
              multiple
              value={selectedScenarios}
              onChange={(e) => setSelectedScenarios(e.target.value)}
              renderValue={(selected) => selected.join(', ')}
            >
              {scenarios.map((scenario) => (
                <MenuItem key={scenario.name} value={scenario.name}>
                  <Checkbox checked={selectedScenarios.includes(scenario.name)} />
                  <ListItemText primary={scenario.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <Button
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={runTests}
          disabled={!url || selectedScenarios.length === 0 || loading}
        >
          {loading ? 'Running Tests...' : 'Run Tests'}
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {results && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Test Results
          </Typography>
          {results.results.map((result, index) => (
            <Box key={index} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Scenario: {result.scenario}
              </Typography>
              <List>
                {result.steps.map((step, stepIndex) => (
                  <React.Fragment key={stepIndex}>
                    <ListItem>
                      <ListItemIcon>
                        {step.status === 'passed' ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Error color="error" />
                        )}
                      </ListItemIcon>
                      <MuiListItemText
                        primary={step.testName}
                        secondary={
                          step.error ? (
                            <Typography color="error">{step.error}</Typography>
                          ) : (
                            `Duration: ${step.duration}ms`
                          )
                        }
                      />
                    </ListItem>
                    {stepIndex < result.steps.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default TestExecution; 