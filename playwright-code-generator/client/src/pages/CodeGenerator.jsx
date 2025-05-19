import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
} from '@mui/material';
import { Code, Api } from '@mui/icons-material';

const CodeGenerator = () => {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [testData, setTestData] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiMethod, setApiMethod] = useState('GET');
  const [apiRequestBody, setApiRequestBody] = useState('');
  const [apiResponseSchema, setApiResponseSchema] = useState('');

  useEffect(() => {
    // Fetch scenarios when component mounts
    const fetchScenarios = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/scenarios');
        const data = await response.json();
        setScenarios(data);
      } catch (error) {
        console.error('Failed to fetch scenarios:', error);
      }
    };

    fetchScenarios();
  }, []);

  const generateCode = async () => {
    try {
      const scenario = scenarios.find(s => s.name === selectedScenario);
      if (!scenario) return;

      const response = await fetch('http://localhost:3002/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenario,
          testData: testData ? JSON.parse(testData) : {},
        }),
      });

      const { code } = await response.json();
      setGeneratedCode(code);
    } catch (error) {
      console.error('Failed to generate code:', error);
    }
  };

  const generateApiCode = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/generate-api-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: apiEndpoint,
          method: apiMethod,
          requestBody: apiRequestBody ? JSON.parse(apiRequestBody) : null,
          responseSchema: apiResponseSchema ? JSON.parse(apiResponseSchema) : null,
        }),
      });

      const { code } = await response.json();
      setGeneratedCode(code);
    } catch (error) {
      console.error('Failed to generate API code:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              UI Test Code Generation
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Scenario</InputLabel>
              <Select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
              >
                {scenarios.map((scenario) => (
                  <MenuItem key={scenario.name} value={scenario.name}>
                    {scenario.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Test Data (JSON)"
              multiline
              rows={4}
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              startIcon={<Code />}
              onClick={generateCode}
              disabled={!selectedScenario}
              fullWidth
            >
              Generate UI Test Code
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              API Test Code Generation
            </Typography>
            <TextField
              label="API Endpoint"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>HTTP Method</InputLabel>
              <Select
                value={apiMethod}
                onChange={(e) => setApiMethod(e.target.value)}
              >
                <MenuItem value="GET">GET</MenuItem>
                <MenuItem value="POST">POST</MenuItem>
                <MenuItem value="PUT">PUT</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
                <MenuItem value="PATCH">PATCH</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Request Body (JSON)"
              multiline
              rows={4}
              value={apiRequestBody}
              onChange={(e) => setApiRequestBody(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Response Schema (JSON)"
              multiline
              rows={4}
              value={apiResponseSchema}
              onChange={(e) => setApiResponseSchema(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Api />}
              onClick={generateApiCode}
              disabled={!apiEndpoint}
              fullWidth
            >
              Generate API Test Code
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {generatedCode && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Generated Code
          </Typography>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '1rem', 
            borderRadius: '4px',
            overflow: 'auto' 
          }}>
            {generatedCode}
          </pre>
          <Button
            variant="outlined"
            onClick={() => navigator.clipboard.writeText(generatedCode)}
            sx={{ mt: 2 }}
          >
            Copy to Clipboard
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default CodeGenerator; 