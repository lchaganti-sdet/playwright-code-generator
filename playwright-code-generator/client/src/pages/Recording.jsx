import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider
} from '@mui/material';
import { PlayArrow, Stop, ContentCopy, Code } from '@mui/icons-material';

const Recording = () => {
  const [url, setUrl] = useState('');
  const [scenarioName, setScenarioName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);

  const startRecording = async () => {
    try {
      if (!url || !scenarioName) {
        setError('URL and scenario name are required');
        return;
      }

      setLoading(true);
      setError(null);
      setGeneratedCode(null);

      const response = await fetch('http://localhost:3002/api/recording/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: url.startsWith('http') ? url : `https://${url}`,
          scenarioName 
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start recording');
      }

      setSessionId(data.sessionId);
      setIsRecording(true);
      setError(null);
    } catch (error) {
      setError(error.message);
      setIsRecording(false);
    } finally {
      setLoading(false);
    }
  };

  const pollSteps = async (sessionId) => {
    if (!isRecording) return;

    try {
      const response = await fetch(`http://localhost:3002/api/recording/status/${sessionId}`);
      const data = await response.json();

      if (response.ok && data.steps) {
        setSteps(data.steps);
      }

      // Continue polling if still recording
      if (isRecording) {
        setTimeout(() => pollSteps(sessionId), 1000);
      }
    } catch (error) {
      console.error('Error polling steps:', error);
    }
  };

  const stopRecording = async () => {
    try {
      if (!sessionId) {
        setError('No active recording session');
        return;
      }

      setLoading(true);
      setError(null);

      // Format URL properly
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;

      const response = await fetch('http://localhost:3002/api/recording/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sessionId,
          scenarioName,
          url: formattedUrl
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to stop recording');
      }

      if (data.steps) {
        setSteps(Array.isArray(data.steps) ? data.steps : []);
      }
      
      if (data.testCode) {
        setGeneratedCode(data.testCode);
      }

      setIsRecording(false);
      setSessionId(null);
      setError(null);

      // Refresh scenarios list
      try {
        const scenariosResponse = await fetch(`http://localhost:3002/api/scenarios?url=${encodeURIComponent(formattedUrl)}`);
        if (!scenariosResponse.ok) {
          console.warn('Failed to refresh scenarios list');
        }
      } catch (error) {
        console.error('Failed to refresh scenarios:', error);
      }

      alert('Test code has been generated and saved. You can now execute it from the Test Execution page.');
    } catch (error) {
      console.error('Stop recording error:', error);
      setError(error.message || 'Failed to stop recording');
      setIsRecording(false);
    } finally {
      setLoading(false);
    }
  };

  const copySteps = () => {
    const stepsText = steps.map(step => step.description).join('\n');
    navigator.clipboard.writeText(stepsText);
  };

  const copyGeneratedCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Record Test Scenario
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          label="Application URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          fullWidth
          margin="normal"
          placeholder="https://www.gmail.com"
          disabled={isRecording}
        />
        <TextField
          label="Scenario Name"
          value={scenarioName}
          onChange={(e) => setScenarioName(e.target.value)}
          fullWidth
          margin="normal"
          placeholder="Gmail Login"
          disabled={isRecording}
        />
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrow />}
            onClick={startRecording}
            disabled={!url || !scenarioName || isRecording || loading}
          >
            Start Recording
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Stop />}
            onClick={stopRecording}
            disabled={!isRecording || loading}
          >
            Stop Recording
          </Button>
        </Box>
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

      {steps.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Recorded Steps</Typography>
            <IconButton onClick={copySteps} title="Copy Steps">
              <ContentCopy />
            </IconButton>
          </Box>
          <List>
            {steps.map((step, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={step.description}
                  secondary={`Type: ${step.type}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {generatedCode && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Generated Test Code</Typography>
            <IconButton onClick={copyGeneratedCode} title="Copy Code">
              <ContentCopy />
            </IconButton>
          </Box>
          <Paper 
            sx={{ 
              p: 2, 
              bgcolor: 'grey.100', 
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              overflowX: 'auto'
            }}
          >
            {generatedCode}
          </Paper>
          <Alert severity="success" sx={{ mt: 2 }}>
            Test code has been saved and is available for execution in the Test Execution page.
          </Alert>
        </Paper>
      )}
    </Box>
  );
};

export default Recording; 