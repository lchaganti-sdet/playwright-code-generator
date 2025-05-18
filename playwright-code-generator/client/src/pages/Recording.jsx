import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
} from '@mui/material';
import { PlayArrow, Stop } from '@mui/icons-material';

const Recording = () => {
  const [url, setUrl] = useState('');
  const [scenarioName, setScenarioName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(0);

  const startRecording = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/start-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, scenarioName }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSessionId(data.sessionId);
        setIsRecording(true);
        setActiveStep(0);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      <Alert severity="error">Failed to start recording: {error.message}</Alert>
    }
  };

  const stopRecording = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/stop-recording', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setIsRecording(false);
        setSteps(data.scenario.steps);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Record Test Scenario
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Application URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
          />
          <TextField
            label="Scenario Name"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            fullWidth
          />
        </Box>
        <Button
          variant="contained"
          color={isRecording ? 'secondary' : 'primary'}
          startIcon={isRecording ? <Stop /> : <PlayArrow />}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
      </Paper>

      {steps.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recorded Steps
          </Typography>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={index}>
                <StepLabel>{step.description}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
      )}
    </Box>
  );
};

export default Recording; 