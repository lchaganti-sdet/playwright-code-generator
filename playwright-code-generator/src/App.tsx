import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  LinearProgress,
  Tooltip,
  ImageList,
  ImageListItem,
  FormControlLabel,
  Checkbox,
  Snackbar,
  ListItemIcon
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BugReportIcon from '@mui/icons-material/BugReport';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PhotoIcon from '@mui/icons-material/Photo';
import StopIcon from '@mui/icons-material/Stop';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { TestRunner, TestStep, TestResult, TestStepResult } from './testRunner';

interface Step {
  id: number;
  description: string;
  type: 'login' | 'general' | 'navigation' | 'action';
  testData?: {
    username?: string;
    password?: string;
    selector?: string;
    expectedText?: string;
    action?: string;
    value?: string;
  };
}

interface TestScenario {
  name: string;
  description: string;
  steps: Step[];
  bddSteps?: string[];
}

interface PageTemplate {
  url: string;
  name: string;
  selectors: {
    login?: {
      username: string;
      password: string;
      submit: string;
    };
    navigation?: {
      [key: string]: string;
    };
    actions?: {
      [key: string]: string;
    };
  };
  scenarios?: {
    [key: string]: {
      description: string;
      steps: Partial<Step>[];
      bddSteps?: string[];
    };
  };
}

interface TestDataOption {
  type: 'datatable' | 'database' | 'hardcoded';
  source?: string;
  data?: any;
}

const pageTemplates: PageTemplate[] = [
  {
    url: 'saucedemo.com',
    name: 'Sauce Demo',
    selectors: {
      login: {
        username: '#user-name',
        password: '#password',
        submit: '#login-button'
      },
      navigation: {
        'Products': '.inventory_list',
        'Cart': '.shopping_cart_link',
        'Menu': '#react-burger-menu-btn'
      },
      actions: {
        'Add to Cart': '.btn_inventory',
        'Remove from Cart': '.btn_secondary',
        'Checkout': '#checkout',
        'Continue Shopping': '#continue-shopping'
      }
    },
    scenarios: {
      'Login Flow': {
        description: 'Test the login functionality with valid credentials',
        bddSteps: [
          'Given I am on the login page',
          'When I enter valid credentials',
          'Then I should be logged in successfully'
        ],
        steps: [
          {
            type: 'login',
            description: 'Login with valid credentials',
            testData: {
              username: 'standard_user',
              password: 'secret_sauce',
              selector: '#user-name, #password',
              expectedText: 'Products'
            }
          }
        ]
      },
      'Shopping Flow': {
        description: 'Test the complete shopping process',
        bddSteps: [
          'Given I am logged in as a standard user',
          'When I add an item to the cart',
          'And I navigate to the cart',
          'And I proceed to checkout',
          'Then I should see the checkout page'
        ],
        steps: [
          {
            type: 'login',
            description: 'Login with valid credentials',
            testData: {
              username: 'standard_user',
              password: 'secret_sauce',
              selector: '#user-name, #password'
            }
          },
          {
            type: 'action',
            description: 'Add first item to cart',
            testData: {
              selector: '.btn_inventory',
              action: 'click'
            }
          },
          {
            type: 'navigation',
            description: 'Navigate to cart',
            testData: {
              selector: '.shopping_cart_link',
              action: 'click'
            }
          },
          {
            type: 'action',
            description: 'Proceed to checkout',
            testData: {
              selector: '#checkout',
              action: 'click'
            }
          }
        ]
      }
    }
  },
  // Add more templates for other websites
];

function App() {
  const [url, setUrl] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState('');
  const [stepType, setStepType] = useState<'login' | 'general' | 'navigation' | 'action'>('general');
  const [testData, setTestData] = useState({
    username: '',
    password: '',
    selector: '',
    expectedText: '',
    action: '',
    value: ''
  });
  const [generatedCode, setGeneratedCode] = useState('');
  const [currentTemplate, setCurrentTemplate] = useState<PageTemplate | null>(null);
  const [scenarioDialogOpen, setScenarioDialogOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult | null>(null);
  const [executionMode, setExecutionMode] = useState<'headed' | 'headless'>('headless');
  const [showResults, setShowResults] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState('');
  const [showExecutionView, setShowExecutionView] = useState(false);
  const [screenshots, setScreenshots] = useState<{ [key: string]: string }>({});
  const [showScreenshots, setShowScreenshots] = useState(false);
  const [headed, setHeaded] = useState(false);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [availableScenarios, setAvailableScenarios] = useState<TestScenario[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSessionId, setRecordingSessionId] = useState<string | null>(null);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [testDataOption, setTestDataOption] = useState<TestDataOption>({ type: 'hardcoded' });
  const [groovyScript, setGroovyScript] = useState('');
  const [convertedTypeScript, setConvertedTypeScript] = useState('');

  useEffect(() => {
    const template = pageTemplates.find(t => url.includes(t.url));
    setCurrentTemplate(template || null);

    // Fetch available scenarios for the URL
    if (url) {
      fetch(`http://localhost:3002/api/scenarios?url=${encodeURIComponent(url)}`)
        .then(res => res.json())
        .then(scenarios => {
          setAvailableScenarios(scenarios);
        })
        .catch(err => {
          console.error('Failed to fetch scenarios:', err);
        });
    } else {
      setAvailableScenarios([]);
    }
  }, [url]);

  const handleAddStep = () => {
    if (currentStep.trim()) {
      const newStep: Step = {
        id: Date.now(),
        description: currentStep.trim(),
        type: stepType,
        testData: { ...testData }
      };
      setSteps([...steps, newStep]);
      setCurrentStep('');
      setTestData({
        username: '',
        password: '',
        selector: '',
        expectedText: '',
        action: '',
        value: ''
      });
    }
  };

  const handleDeleteStep = (id: number) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const applyLoginTemplate = () => {
    if (currentTemplate?.selectors.login) {
      setTestData({
        ...testData,
        selector: `${currentTemplate.selectors.login.username}, ${currentTemplate.selectors.login.password}`,
      });
    }
  };

  const applyNavigationTemplate = (navItem: string) => {
    if (currentTemplate?.selectors.navigation?.[navItem]) {
      setTestData({
        ...testData,
        selector: currentTemplate.selectors.navigation[navItem],
        action: 'click'
      });
    }
  };

  const applyActionTemplate = (action: string) => {
    if (currentTemplate?.selectors.actions?.[action]) {
      setTestData({
        ...testData,
        selector: currentTemplate.selectors.actions[action],
        action: 'click'
      });
    }
  };

  const applyScenario = (scenarioName: string) => {
    const scenario = currentTemplate?.scenarios?.[scenarioName];
    if (scenario) {
      const newSteps: Step[] = scenario.steps.map(step => ({
        id: Date.now() + Math.random(),
        description: step.description || '',
        type: step.type || 'general',
        testData: step.testData
      }));
      setSteps(newSteps);
      setScenarioDialogOpen(false);
    }
  };

  const generateBDDCode = () => {
    if (!url) return '';

    return `import { test, expect } from '@playwright/test';

test.describe('${currentTemplate?.name || 'Automated'} Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('${url}');
  });

  ${steps.map((step, index) => {
    if (step.type === 'login') {
      const [usernameSelector, passwordSelector] = (step.testData?.selector || 'input[name="username"], input[name="password"]').split(', ');
      return `test('${step.description}', async ({ page }) => {
    // Given I am on the login page
    await page.goto('${url}');

    // When I enter valid credentials
    await page.fill('${usernameSelector.trim()}', '${step.testData?.username || 'testuser'}');
    await page.fill('${passwordSelector.trim()}', '${step.testData?.password || 'testpass'}');
    await page.click('${currentTemplate?.selectors.login?.submit || 'button[type="submit"]'}');
    
    // Then I should be logged in successfully
    ${step.testData?.expectedText ? `await expect(page.locator('${step.testData.selector}')).toContainText('${step.testData.expectedText}');` : ''}
  });`;
    } else if (step.type === 'navigation') {
      return `test('${step.description}', async ({ page }) => {
    // Given I am on the previous page
    // When I navigate to the target page
    await page.click('${step.testData?.selector}');
    
    // Then I should see the target page
    ${step.testData?.expectedText ? `await expect(page.locator('${step.testData.selector}')).toBeVisible();` : ''}
  });`;
    } else if (step.type === 'action') {
      return `test('${step.description}', async ({ page }) => {
    // Given I am on the page
    // When I perform the action
    await page.click('${step.testData?.selector}');
    
    // Then the action should be completed
    ${step.testData?.expectedText ? `await expect(page.locator('${step.testData.selector}')).toBeVisible();` : ''}
  });`;
    }
    return `test('${step.description}', async ({ page }) => {
    // TODO: Implement the step: ${step.description}
  });`;
  }).join('\n\n')}
});`;
  };

  const generatePlaywrightCode = () => {
    const code = generateBDDCode();
    setGeneratedCode(code);
  };

  const captureScreenshot = async (page: any, testName: string) => {
    try {
      const screenshot = await page.screenshot({ fullPage: true });
      const base64Screenshot = `data:image/png;base64,${screenshot.toString('base64')}`;
      setScreenshots(prev => ({ ...prev, [testName]: base64Screenshot }));
      return base64Screenshot;
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      return null;
    }
  };

  const simulateTestExecution = async (step: Step, index: number) => {
    const actions = [
      'Navigating to page...',
      'Waiting for elements...',
      'Filling form fields...',
      'Clicking elements...',
      'Verifying results...'
    ];

    for (const action of actions) {
      setCurrentAction(action);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const status = Math.random() > 0.2 ? 'passed' as const : 'failed' as const;
    const error = status === 'failed' ? 'Element not found or timeout' : undefined;
    
    return {
      testName: step.description,
      status,
      duration: Math.floor(Math.random() * 1000) + 500,
      error,
      currentAction: 'Test completed',
      screenshot: status === 'failed' ? 'screenshot-placeholder' : undefined
    };
  };

  const handleRunTests = async () => {
    try {
      setIsRunning(true);
      setError(null);
      setResults(null);

      const testRunner = new TestRunner();
      const result = await testRunner.runTests(url, headed, selectedScenarios);
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
  };

  const handleScenarioChange = (scenarioName: string) => {
    setExpandedScenario(expandedScenario === scenarioName ? null : scenarioName);
  };

  const handleScenarioSelection = (scenarioName: string) => {
    setSelectedScenarios(prev => 
      prev.includes(scenarioName)
        ? prev.filter(name => name !== scenarioName)
        : [...prev, scenarioName]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'running':
        return <HourglassEmptyIcon color="primary" />;
      default:
        return null;
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'passed':
        return <Chip label="Passed" color="success" size="small" />;
      case 'failed':
        return <Chip label="Failed" color="error" size="small" />;
      case 'running':
        return <Chip label="Running" color="primary" size="small" />;
      default:
        return null;
    }
  };

  const startRecording = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/recording/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await response.json();
      setRecordingSessionId(data.sessionId);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError(error.message);
    }
  };

  const stopRecording = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/recording/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: recordingSessionId })
      });
      const data = await response.json();
      
      // Convert recorded steps to test steps
      const newSteps = data.steps.map((step: any) => ({
        id: Date.now() + Math.random(),
        description: step.description,
        type: step.type,
        testData: step.testData
      }));
      
      setSteps(newSteps);
      setIsRecording(false);
      setRecordingSessionId(null);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setError(error.message);
    }
  };

  const executeScenario = async (scenario: TestScenario) => {
    try {
      setIsRunning(true);
      setError(null);
      
      const response = await fetch('http://localhost:3002/api/scenarios/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          scenario,
          headed
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setResults({
          status: 'success',
          details: [{
            scenarioName: scenario.name,
            steps: result.results.map((r: any) => ({
              testName: r.step,
              status: r.success ? 'passed' : 'failed',
              duration: 0,
              error: r.error,
              screenshot: r.screenshot
            }))
          }],
          screenshots: {}
        });
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const convertGroovyToTypeScript = (groovyCode: string) => {
    // Basic conversion logic - can be enhanced based on specific Groovy patterns
    let typescriptCode = groovyCode
      .replace(/def\s+(\w+)\s*=\s*/g, 'const $1 = ')
      .replace(/String/g, 'string')
      .replace(/Integer/g, 'number')
      .replace(/Boolean/g, 'boolean')
      .replace(/ArrayList/g, 'Array')
      .replace(/\.each\s*{/g, '.forEach(')
      .replace(/->/g, '=>')
      .replace(/}\s*$/g, '})')
      .replace(/assert\s+/g, 'expect(')
      .replace(/\.shouldBe\(/g, ').toBe(')
      .replace(/\.shouldContain\(/g, ').toContain(');

    // Add Playwright specific conversions
    typescriptCode = typescriptCode
      .replace(/driver\.findElement\(By\.id\("([^"]+)"\)\)/g, 'page.locator("#$1")')
      .replace(/driver\.findElement\(By\.className\("([^"]+)"\)\)/g, 'page.locator(".$1")')
      .replace(/driver\.findElement\(By\.xpath\("([^"]+)"\)\)/g, 'page.locator("$1")')
      .replace(/\.click\(\)/g, '.click()')
      .replace(/\.sendKeys\(/g, '.fill(')
      .replace(/\.getText\(\)/g, '.textContent()');

    return typescriptCode;
  };

  const generateTestData = async () => {
    switch (testDataOption.type) {
      case 'datatable':
        // Implement DataTable data generation
        const dataTableData = await fetch('http://localhost:3002/api/testdata/datatable')
          .then(res => res.json());
        setTestData(dataTableData);
        break;
      case 'database':
        // Implement database data generation
        const dbData = await fetch('http://localhost:3002/api/testdata/database')
          .then(res => res.json());
        setTestData(dbData);
        break;
      case 'hardcoded':
        // Use hardcoded test data
        setTestData({
          username: 'standard_user',
          password: 'secret_sauce',
          // Add more hardcoded test data as needed
        });
        break;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Playwright Test Runner
        </Typography>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter website URL"
              disabled={isRunning || isRecording}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={headed}
                  onChange={(e) => setHeaded(e.target.checked)}
                  disabled={isRunning || isRecording}
                />
              }
              label="Headed Mode"
            />
            <Button
              variant="contained"
              onClick={handleRunTests}
              disabled={isRunning || isRecording || !url}
              startIcon={isRunning ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            >
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="New Scenario Name"
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
              placeholder="Enter scenario name"
              disabled={isRunning || isRecording}
            />
            <Button
              variant="contained"
              color={isRecording ? 'error' : 'primary'}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isRunning || (!isRecording && (!url || !newScenarioName))}
              startIcon={isRecording ? <StopIcon /> : <FiberManualRecordIcon />}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </Button>
          </Box>

          {availableScenarios.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Select Scenarios to Run:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableScenarios.map((scenario) => (
                  <Chip
                    key={scenario.name}
                    label={scenario.name}
                    onClick={() => handleScenarioSelection(scenario.name)}
                    color={selectedScenarios.includes(scenario.name) ? 'primary' : 'default'}
                    variant={selectedScenarios.includes(scenario.name) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {results && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Test Results
            </Typography>
            {results.details.map((scenario) => (
              <Accordion
                key={scenario.scenarioName}
                expanded={expandedScenario === scenario.scenarioName}
                onChange={() => handleScenarioChange(scenario.scenarioName)}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getStatusIcon(scenario.steps.every(step => step.status === 'passed') ? 'passed' : 'failed')}
                    <Typography>{scenario.scenarioName}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {scenario.steps.map((step, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {getStatusIcon(step.status)}
                        </ListItemIcon>
                        <ListItemText
                          primary={step.testName}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {step.currentAction}
                              </Typography>
                              {step.error && (
                                <Typography variant="body2" color="error">
                                  {step.error}
                                </Typography>
                              )}
                              {step.screenshot && (
                                <Box sx={{ mt: 1 }}>
                                  <img
                                    src={step.screenshot}
                                    alt={`Screenshot for ${step.testName}`}
                                    style={{ maxWidth: '100%', height: 'auto' }}
                                  />
                                </Box>
                              )}
                            </Box>
                          }
                        />
                        <Box sx={{ ml: 2 }}>
                          {getStatusChip(step.status)}
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        <Paper sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Generated Code</Typography>
            <IconButton onClick={copyToClipboard} title="Copy to clipboard">
              <ContentCopyIcon />
            </IconButton>
          </Box>
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '1rem', 
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            {generatedCode}
          </pre>
        </Paper>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Convert Groovy to TypeScript
          </Typography>
          <TextField
            label="Groovy Script"
            multiline
            rows={4}
            value={groovyScript}
            onChange={(e) => setGroovyScript(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={() => setConvertedTypeScript(convertGroovyToTypeScript(groovyScript))}
            sx={{ mb: 2 }}
          >
            Convert to TypeScript
          </Button>
          {convertedTypeScript && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Converted TypeScript:
              </Typography>
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '1rem', 
                borderRadius: '4px',
                overflow: 'auto' 
              }}>
                {convertedTypeScript}
              </pre>
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Test Data Generation
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Test Data Source</InputLabel>
            <Select
              value={testDataOption.type}
              onChange={(e) => setTestDataOption({ type: e.target.value as TestDataOption['type'] })}
            >
              <MenuItem value="datatable">DataTable</MenuItem>
              <MenuItem value="database">Database</MenuItem>
              <MenuItem value="hardcoded">Hardcoded</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            onClick={generateTestData}
          >
            Generate Test Data
          </Button>
        </Paper>

        <Dialog
          open={scenarioDialogOpen}
          onClose={() => setScenarioDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Available Test Scenarios</DialogTitle>
          <DialogContent>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{ mb: 2 }}
            >
              <Tab label="Predefined Scenarios" />
              <Tab label="Custom Scenarios" />
            </Tabs>

            {activeTab === 0 && currentTemplate?.scenarios && (
              <Box>
                {Object.entries(currentTemplate.scenarios).map(([name, scenario]) => (
                  <Paper key={name} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="h6">{name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {scenario.description}
                    </Typography>
                    {scenario.bddSteps && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          BDD Steps:
                        </Typography>
                        {scenario.bddSteps.map((step, index) => (
                          <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                            {step}
                          </Typography>
                        ))}
                      </Box>
                    )}
                    <Button
                      variant="contained"
                      onClick={() => applyScenario(name)}
                    >
                      Apply Scenario
                    </Button>
                  </Paper>
                ))}
              </Box>
            )}

            {activeTab === 1 && (
              <Box>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Custom scenarios will be generated based on page analysis.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => {
                    // TODO: Implement custom scenario generation
                    setScenarioDialogOpen(false);
                  }}
                >
                  Generate Custom Scenarios
                </Button>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScenarioDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
}

export default App; 