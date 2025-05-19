import express from 'express';
import cors from 'cors';
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

// Store recorded scenarios
const recordedScenarios = new Map();

// Store recording sessions
const recordingSessions = new Map();

// Define test scenarios for different websites
const testScenarios = {
  'saucedemo.com': [
    {
      name: 'Login Flow',
      steps: [
        {
          description: 'Login with valid credentials',
          type: 'login',
          testData: {
            username: 'standard_user',
            password: 'secret_sauce',
            selector: '#user-name',
            expectedText: 'Products'
          }
        }
      ]
    },
    {
      name: 'Shopping Flow',
      steps: [
        {
          description: 'Login with valid credentials',
          type: 'login',
          testData: {
            username: 'standard_user',
            password: 'secret_sauce',
            selector: '#user-name',
            expectedText: 'Products'
          }
        },
        {
          description: 'Add first item to cart',
          type: 'action',
          testData: {
            selector: '[data-test="add-to-cart-sauce-labs-backpack"]',
            expectedText: 'Remove'
          }
        },
        {
          description: 'Navigate to cart',
          type: 'navigation',
          testData: {
            selector: '[data-test="shopping-cart-link"]',
            expectedText: 'Your Cart'
          }
        },
        {
          description: 'Proceed to checkout',
          type: 'action',
          testData: {
            selector: '[data-test="checkout"]',
            expectedText: 'Checkout: Your Information'
          }
        }
      ]
    },
    {
      name: 'Error Handling Flow',
      steps: [
        {
          description: 'Login with invalid credentials',
          type: 'login',
          testData: {
            username: 'invalid_user',
            password: 'invalid_pass',
            selector: '#user-name',
            expectedText: 'Epic sadface'
          }
        }
      ]
    }
  ],
  'www.saucedemo.com': [
    {
      name: 'Login Flow',
      steps: [
        {
          description: 'Login with valid credentials',
          type: 'login',
          testData: {
            username: 'standard_user',
            password: 'secret_sauce',
            selector: '#user-name, #password',
            expectedText: 'Products'
          }
        }
      ]
    },
    {
      name: 'Shopping Flow',
      steps: [
        {
          description: 'Login with valid credentials',
          type: 'login',
          testData: {
            username: 'standard_user',
            password: 'secret_sauce',
            selector: '#user-name, #password',
            expectedText: 'Products'
          }
        },
        {
          description: 'Add first item to cart',
          type: 'action',
          testData: {
            selector: '.inventory_item:first-child .btn_inventory',
            expectedText: 'Remove'
          }
        },
        {
          description: 'Navigate to cart',
          type: 'navigation',
          testData: {
            selector: '.shopping_cart_link',
            expectedText: 'Your Cart'
          }
        },
        {
          description: 'Proceed to checkout',
          type: 'action',
          testData: {
            selector: '#checkout',
            expectedText: 'Checkout: Your Information'
          }
        }
      ]
    },
    {
      name: 'Error Handling Flow',
      steps: [
        {
          description: 'Login with invalid credentials',
          type: 'login',
          testData: {
            username: 'invalid_user',
            password: 'invalid_pass',
            selector: '#user-name, #password',
            expectedText: 'Epic sadface'
          }
        }
      ]
    }
  ]
};

// Helper function to get test scenarios for a URL
function getTestScenarios(url) {
  // Remove protocol and www if present, then get the domain
  const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  console.log('Extracted domain:', domain);
  
  // Return recorded scenarios for this domain if they exist
  if (recordedScenarios.has(domain)) {
    return recordedScenarios.get(domain);
  }
  
  // Return default scenarios for known domains
  return testScenarios[domain] || [];
}

// Helper function to generate test code
const generateTestCode = (steps, scenarioName) => {
  const imports = `import { test, expect } from '@playwright/test';\n\n`;
  const testFunction = `test('${scenarioName}', async ({ page }) => {\n`;
  const stepsCode = steps.map(step => {
    switch (step.type) {
      case 'click':
        return `  // ${step.description}
  await page.click('${step.selector}');
  await page.waitForLoadState('networkidle');`;
      case 'fill':
        return `  // ${step.description}
  await page.fill('${step.selector}', '${step.value}');`;
      case 'select':
        return `  // ${step.description}
  await page.selectOption('${step.selector}', '${step.value}');`;
      case 'check':
        return `  // ${step.description}
  await page.check('${step.selector}');`;
      case 'uncheck':
        return `  // ${step.description}
  await page.uncheck('${step.selector}');`;
      case 'navigate':
        return `  // ${step.description}
  await page.goto('${step.url}');
  await page.waitForLoadState('networkidle');`;
      case 'login':
        return `  // ${step.description}
  await page.fill('${step.testData.selector}', '${step.testData.username}');
  await page.fill('#password', '${step.testData.password}');
  await page.click('[data-test="login-button"]');
  await page.waitForLoadState('networkidle');`;
      case 'action':
        return `  // ${step.description}
  await page.click('${step.testData.selector}');
  await page.waitForLoadState('networkidle');`;
      default:
        return `  // ${step.description}`;
    }
  }).join('\n\n');
  return `${imports}${testFunction}${stepsCode}\n});\n`;
};

// Helper function to validate URL
function validateUrl(url) {
  try {
    // Add https:// if no protocol is specified
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const parsedUrl = new URL(url);
    return parsedUrl.toString();
  } catch (error) {
    throw new Error('Invalid URL format. Please provide a valid URL (e.g., https://gmail.com)');
  }
}

// API endpoint to start recording
app.post('/api/recording/start', async (req, res) => {
  try {
    const { url, scenarioName } = req.body;
    
    if (!url || !scenarioName) {
      return res.status(400).json({ error: 'URL and scenario name are required' });
    }

    // Ensure URL has proper format
    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = `https://${url}`;
    }

    // Validate URL format
    try {
      new URL(formattedUrl);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const sessionId = Date.now().toString();
    const browser = await chromium.launch({ 
      headless: false,
      slowMo: 50
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });

    const page = await context.newPage();
    const steps = [];

    // Set up event listeners for recording
    await page.exposeFunction('recordClick', async (selector, text) => {
      steps.push({
        type: 'click',
        selector,
        description: `Click on ${text || selector}`,
        timestamp: Date.now()
      });
    });

    await page.exposeFunction('recordInput', async (selector, value, text) => {
      steps.push({
        type: 'fill',
        selector,
        value,
        description: `Fill ${text || selector} with ${value}`,
        timestamp: Date.now()
      });
    });

    // Add event listeners
    await page.evaluate(() => {
      document.addEventListener('click', (e) => {
        const selector = getSelector(e.target);
        const text = e.target.textContent?.trim() || '';
        window.recordClick(selector, text);
      });

      document.addEventListener('input', (e) => {
        const selector = getSelector(e.target);
        const text = e.target.placeholder || e.target.name || '';
        window.recordInput(selector, e.target.value, text);
      });

      function getSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.name) return `[name="${element.name}"]`;
        if (element.getAttribute('data-test')) return `[data-test="${element.getAttribute('data-test')}"]`;
        if (element.className) return `.${element.className.split(' ').join('.')}`;
        return element.tagName.toLowerCase();
      }
    });

    // Navigate to the URL with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`Navigating to ${formattedUrl} (attempt ${retryCount + 1})`);
        await page.goto(formattedUrl, { waitUntil: 'networkidle' });
        break;
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    recordingSessions.set(sessionId, {
      browser,
      context,
      page,
      steps,
      scenarioName,
      url: formattedUrl
    });

    res.json({ 
      success: true, 
      message: 'Recording started successfully',
      sessionId 
    });
  } catch (error) {
    console.error('Failed to start recording:', error);
    res.status(500).json({ 
      error: 'Failed to start recording',
      details: error.message 
    });
  }
});

// API endpoint to stop recording
app.post('/api/recording/stop', async (req, res) => {
  try {
    const { sessionId, scenarioName, url } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = recordingSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Recording session not found' });
    }

    const { browser, context, page, steps } = session;
    
    // Generate test code with proper steps
    const testCode = `import { test, expect } from '@playwright/test';

test('${scenarioName || session.scenarioName}', async ({ page }) => {
  // Navigate to the application
  await page.goto('${session.url}');
  await page.waitForLoadState('networkidle');

${steps.map(step => {
  switch (step.type) {
    case 'click':
      return `  // ${step.description}
  await page.click('${step.selector}');
  await page.waitForLoadState('networkidle');`;
    case 'fill':
      return `  // ${step.description}
  await page.fill('${step.selector}', '${step.value}');`;
    default:
      return `  // ${step.description}`;
  }
}).join('\n\n')}
});`;
    
    // Save test code to file
    const testFileName = `${scenarioName || session.scenarioName}.spec.js`;
    const testFilePath = join(__dirname, 'tests', testFileName);
    
    // Ensure tests directory exists
    try {
      await fs.mkdir(join(__dirname, 'tests'), { recursive: true });
      await fs.writeFile(testFilePath, testCode);
    } catch (error) {
      console.warn('Failed to save test file:', error);
    }

    // Save the recorded scenario
    let domain = 'default';
    try {
      if (url) {
        const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        domain = new URL(formattedUrl).hostname.replace(/^www\./, '');
      }
    } catch (error) {
      console.warn('Failed to parse URL, using default domain:', error);
    }

    const scenarios = recordedScenarios.get(domain) || [];
    scenarios.push({
      name: scenarioName || session.scenarioName,
      steps: steps
    });
    recordedScenarios.set(domain, scenarios);

    // Clean up
    try {
      await page.close();
      await context.close();
      await browser.close();
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
    
    recordingSessions.delete(sessionId);

    res.json({
      success: true,
      message: 'Recording stopped and test code generated',
      steps,
      testCode,
      testFilePath
    });
  } catch (error) {
    console.error('Failed to stop recording:', error);
    res.status(500).json({ 
      error: 'Failed to stop recording',
      details: error.message 
    });
  }
});

// API endpoint to run tests
app.post('/api/run-tests', async (req, res) => {
  const { url, selectedScenarios, headed } = req.body;
  
  if (!url) {
    return res.status(400).json({
      status: 'error',
      message: 'URL is required'
    });
  }

  try {
    console.log('Received test request:', req.body);
    
    // Get scenarios for the URL
    const scenarios = getTestScenarios(url);
    if (!scenarios.length) {
      return res.status(404).json({
        status: 'error',
        message: 'No test scenarios found for this URL'
      });
    }

    // Filter scenarios if specific ones were selected
    const scenariosToRun = selectedScenarios 
      ? scenarios.filter(s => selectedScenarios.includes(s.name))
      : scenarios;

    console.log('Launching browser...');
    const browser = await chromium.launch({ 
      headless: !headed,
      args: [
        '--start-maximized',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
    console.log('Browser launched successfully');

    const results = [];
    const screenshots = [];

    for (const scenario of scenariosToRun) {
      console.log(`Running scenario: ${scenario.name}`);
      const page = await browser.newPage();
      console.log('New page created successfully');

      try {
        // Navigate to the URL with retry logic
        let navigationSuccess = false;
        let attempts = 0;
        const maxAttempts = 3;

        while (!navigationSuccess && attempts < maxAttempts) {
          try {
            attempts++;
            console.log(`Navigating to ${url} (attempt ${attempts})`);
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            navigationSuccess = true;
          } catch (error) {
            console.error(`Navigation attempt ${attempts} failed:`, error);
            if (attempts === maxAttempts) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        const scenarioResults = [];
        for (const step of scenario.steps) {
          console.log(`Executing step: ${step.description}`);
          
          try {
            switch (step.type) {
              case 'login':
                console.log('Filling login form...');
                await page.waitForSelector('#user-name', { timeout: 30000 });
                await page.fill('#user-name', step.testData.username);
                await page.fill('#password', step.testData.password);
                await page.click('[data-test="login-button"]');
                console.log('Waiting for expected text...');
                await page.waitForSelector(`text=${step.testData.expectedText}`, { timeout: 30000 });
                break;
                
              case 'action':
                console.log('Performing action...');
                await page.waitForSelector(step.testData.selector, { timeout: 30000 });
                await page.click(step.testData.selector);
                if (step.testData.expectedText) {
                  await page.waitForSelector(`text=${step.testData.expectedText}`, { timeout: 30000 });
                }
                break;
                
              case 'navigation':
                console.log('Performing navigation...');
                await page.waitForSelector(step.testData.selector, { timeout: 30000 });
                await page.click(step.testData.selector);
                if (step.testData.expectedText) {
                  await page.waitForSelector(`text=${step.testData.expectedText}`, { timeout: 30000 });
                }
                break;
            }
            
            scenarioResults.push({
              testName: step.description,
              status: 'passed',
              duration: 0,
              currentAction: 'Test completed'
            });
          } catch (error) {
            console.error(`Step failed: ${step.description}`, error);
            const screenshot = await page.screenshot({ path: `error-${Date.now()}.png` });
            screenshots.push(screenshot);
            scenarioResults.push({
              testName: step.description,
              status: 'failed',
              error: error.message,
              screenshot: screenshot
            });
          }
        }

        results.push({
          scenario: scenario.name,
          steps: scenarioResults
        });
      } catch (error) {
        console.error(`Scenario failed: ${scenario.name}`, error);
        const screenshot = await page.screenshot({ path: `error-${Date.now()}.png` });
        screenshots.push(screenshot);
        results.push({
          scenario: scenario.name,
          status: 'failed',
          error: error.message,
          screenshot: screenshot
        });
      } finally {
        await page.close();
        console.log('Page closed successfully');
      }
    }

    await browser.close();
    console.log('Browser closed successfully');

    res.json({
      status: 'success',
      results,
      screenshots
    });
  } catch (error) {
    console.error('Test execution failed:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// API endpoint to get available scenarios
app.get('/api/scenarios', (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({
      status: 'error',
      message: 'URL is required'
    });
  }

  const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  const scenarios = recordedScenarios.get(domain) || [];
  
  res.json(scenarios);
});

// Get recording status
app.get('/api/recording/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const recording = recordingSessions.get(sessionId);
  if (!recording) {
    return res.status(404).json({ error: 'Recording session not found' });
  }
  res.json({ steps: recording.steps });
});

// Get scenarios
app.get('/api/scenarios', async (req, res) => {
  try {
    const { url } = req.query;
    const testDir = join(__dirname, 'tests');
    const files = await fs.readdir(testDir);
    const scenarios = files
      .filter(file => file.endsWith('.spec.ts'))
      .map(file => ({
        name: file.replace('.spec.ts', ''),
        url,
      }));
    res.json(scenarios);
  } catch (error) {
    console.error('Failed to fetch scenarios:', error);
    res.status(500).json({ error: error.message });
  }
});

// Run tests
app.post('/api/run-tests', async (req, res) => {
  try {
    const { url, selectedScenarios, headed = false } = req.body;
    const results = [];

    for (const scenarioName of selectedScenarios) {
      const testFile = join(__dirname, 'tests', `${scenarioName}.spec.ts`);
      const testCode = await fs.readFile(testFile, 'utf-8');
      
      // Execute test using Playwright
      const browser = await chromium.launch({ headless: !headed });
      const context = await browser.newContext();
      const page = await context.newPage();
      
      try {
        // Execute test code
        const testFunction = new Function('page', testCode);
        await testFunction(page);
        results.push({
          scenario: scenarioName,
          status: 'passed',
          steps: [{ testName: scenarioName, status: 'passed' }],
        });
      } catch (error) {
        results.push({
          scenario: scenarioName,
          status: 'failed',
          steps: [{ testName: scenarioName, status: 'failed', error: error.message }],
        });
      } finally {
        await browser.close();
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Failed to run tests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test data endpoints
app.get('/api/testdata/datatable', (req, res) => {
  // Example DataTable data
  res.json({
    username: 'standard_user',
    password: 'secret_sauce',
    items: [
      { name: 'Sauce Labs Backpack', price: '$29.99' },
      { name: 'Sauce Labs Bike Light', price: '$9.99' }
    ]
  });
});

app.get('/api/testdata/database', (req, res) => {
  // Example database data - replace with actual database connection
  res.json({
    username: 'standard_user',
    password: 'secret_sauce',
    items: [
      { name: 'Sauce Labs Backpack', price: '$29.99' },
      { name: 'Sauce Labs Bike Light', price: '$9.99' }
    ]
  });
});

// API endpoint to generate API automation code
app.post('/api/generate-api-code', (req, res) => {
  try {
    const { endpoint, method, requestBody, responseSchema } = req.body;
    
    const code = `import { test, expect } from '@playwright/test';

test('API Test: ${method.toUpperCase()} ${endpoint}', async ({ request }) => {
  // Make the API request
  const response = await request.${method.toLowerCase()}('${endpoint}'${
      requestBody ? `, {
    data: ${JSON.stringify(requestBody, null, 2)}
  }` : ''
    });

  // Verify response status
  expect(response.ok()).toBeTruthy();

  // Parse response body
  const data = await response.json();

  // Verify response schema
  ${responseSchema ? Object.entries(responseSchema)
    .map(([key, type]) => `expect(typeof data.${key}).toBe('${type}');`)
    .join('\n  ') : ''}

  // Additional assertions can be added here
});`;

    res.json({ code });
  } catch (error) {
    console.error('Failed to generate API code:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to generate UI test code
app.post('/api/generate-code', (req, res) => {
  try {
    const { scenario, testData } = req.body;
    
    const code = `import { test, expect } from '@playwright/test';

// Test Data
const testData = ${JSON.stringify(testData, null, 2)};

test('${scenario.name}', async ({ page }) => {
  // Test Steps
${scenario.steps.map(step => {
  switch (step.type) {
    case 'login':
      return `  // ${step.description}
  await page.fill('${step.testData.selector}', testData.username || '${step.testData.username}');
  await page.fill('#password', testData.password || '${step.testData.password}');
  await page.click('[data-test="login-button"]');
  ${step.testData.expectedText ? `await expect(page.locator('text=${step.testData.expectedText}')).toBeVisible();` : ''}`;
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

    res.json({ code });
  } catch (error) {
    console.error('Failed to generate code:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 