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
} from '@mui/material';
import { Code } from '@mui/icons-material';

const CodeGenerator = () => {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [testData, setTestData] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

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

  const generateCode = () => {
    const scenario = scenarios.find(s => s.name === selectedScenario);
    if (!scenario) return;

    const code = `import { test, expect } from '@playwright/test';

// Test Data
const testData = ${testData || '{}'};

test('${scenario.name}', async ({ page }) => {
  // Test Steps
${scenario.steps.map(step => {
  switch (step.type) {
    case 'login':
      return `  // ${step.description}
  await page.fill('#user-name', testData.username || '${step.testData.username}');
  await page.fill('#password', testData.password || '${step.testData.password}');
  await page.click('[data-test="login-button"]');
  await expect(page.locator('text=${step.testData.expectedText}')).toBeVisible();`;
    case 'action':
      return `  // ${step.description}
  await page.click('${step.testData.selector}');
  ${step.testData.expectedText ? `await expect(page.locator('text=${step.testData.expectedText}')).toBeVisible();` : ''}`;
    case 'navigation':
      return `  // ${step.description}
  await page.click('${step.testData.selector}');
  ${step.testData.expectedText ? `await expect(page.locator('text=${step.testData.expectedText}')).toBeVisible();` : ''}`;
    default:
      return `  // ${step.description}`;
  }
}).join('\n\n')}
});`;

    setGeneratedCode(code);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Generate Playwright Code
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl fullWidth>
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
        </Box>
        <TextField
          label="Test Data (JSON)"
          multiline
          rows={4}
          value={testData}
          onChange={(e) => setTestData(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
        />
        <Button
          variant="contained"
          startIcon={<Code />}
          onClick={generateCode}
          disabled={!selectedScenario}
        >
          Generate Code
        </Button>
      </Paper>

      {generatedCode && (
        <Paper sx={{ p: 3 }}>
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
        </Paper>
      )}
    </Box>
  );
};

export default CodeGenerator; 