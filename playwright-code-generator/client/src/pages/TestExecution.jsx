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
  FormControlLabel
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';

const TestExecution = () => {
  const [url, setUrl] = useState('');
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarios, setSelectedScenarios] = useState([]);
  const [results, setResults] = useState(null);
  const [headed, setHeaded] = useState(false);

  useEffect(() => {
    if (url) {
      fetchScenarios();
    }
  }, [url, fetchScenarios]);

  const fetchScenarios = async () => {
    try {
      const response = await fetch(`http://localhost:3002/api/scenarios?url=${url}`);
      const data = await response.json();
      setScenarios(data);
    } catch (error) {
      console.error('Failed to fetch scenarios:', error);
    }
  };

  const runTests = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/run-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          selectedScenarios,
          headed,
        }),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Failed to run tests:', error);
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
          disabled={!url || selectedScenarios.length === 0}
        >
          Run Tests
        </Button>
      </Paper>

      {results && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Test Results
          </Typography>
          {results.results.map((result, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="subtitle1">{result.scenario}</Typography>
              {result.steps.map((step, stepIndex) => (
                <Alert
                  key={stepIndex}
                  severity={step.status === 'passed' ? 'success' : 'error'}
                  sx={{ mt: 1 }}
                >
                  {step.testName}: {step.status}
                </Alert>
              ))}
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default TestExecution; 