import express from 'express';
import cors from 'cors';
import { chromium } from '@playwright/test';

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

// API endpoint to start recording
app.post('/api/start-recording', async (req, res) => {
  const { url, scenarioName } = req.body;
  
  if (!url || !scenarioName) {
    return res.status(400).json({
      status: 'error',
      message: 'URL and scenario name are required'
    });
  }

  try {
    const browser = await chromium.launch({ 
      headless: false,
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });

    const page = await context.newPage();
    
    // Start recording
    const steps = [];
    let isRecording = true;

    // Listen for navigation events
    page.on('load', () => {
      if (isRecording) {
        steps.push({
          description: `Navigate to ${page.url()}`,
          type: 'navigation',
          testData: {
            url: page.url()
          }
        });
      }
    });

    // Listen for click events
    page.on('click', async (event) => {
      if (isRecording) {
        const element = event.target;
        const selector = await page.evaluate(el => {
          // Generate a unique selector for the element
          if (el.id) return `#${el.id}`;
          if (el.className) return `.${el.className.split(' ')[0]}`;
          return el.tagName.toLowerCase();
        }, element);

        steps.push({
          description: `Click on ${selector}`,
          type: 'action',
          testData: {
            selector,
            action: 'click'
          }
        });
      }
    });

    // Listen for form submissions
    page.on('submit', async (event) => {
      if (isRecording) {
        const form = event.target;
        const formData = await page.evaluate(form => {
          const data = {};
          for (const element of form.elements) {
            if (element.name) {
              data[element.name] = element.value;
            }
          }
          return data;
        }, form);

        steps.push({
          description: `Submit form with data: ${JSON.stringify(formData)}`,
          type: 'action',
          testData: {
            selector: await page.evaluate(form => {
              if (form.id) return `#${form.id}`;
              if (form.className) return `.${form.className.split(' ')[0]}`;
              return 'form';
            }, form),
            action: 'submit',
            formData
          }
        });
      }
    });

    // Navigate to the URL
    await page.goto(url);

    // Store recording session
    const sessionId = Date.now().toString();
    recordingSessions.set(sessionId, {
      browser,
      context,
      page,
      steps,
      isRecording,
      url,
      scenarioName
    });

    res.json({
      status: 'success',
      sessionId,
      message: 'Recording started'
    });
  } catch (error) {
    console.error('Failed to start recording:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// API endpoint to stop recording
app.post('/api/stop-recording', async (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({
      status: 'error',
      message: 'Session ID is required'
    });
  }

  const session = recordingSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({
      status: 'error',
      message: 'Recording session not found'
    });
  }

  try {
    session.isRecording = false;
    
    // Save the recorded scenario
    const domain = session.url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    const scenarios = recordedScenarios.get(domain) || [];
    scenarios.push({
      name: session.scenarioName,
      steps: session.steps
    });
    recordedScenarios.set(domain, scenarios);

    // Clean up
    await session.page.close();
    await session.context.close();
    await session.browser.close();
    recordingSessions.delete(sessionId);

    res.json({
      status: 'success',
      message: 'Recording stopped',
      scenario: {
        name: session.scenarioName,
        steps: session.steps
      }
    });
  } catch (error) {
    console.error('Failed to stop recording:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
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

// Start recording session
app.post('/api/recording/start', async (req, res) => {
  try {
    const { url } = req.body;
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Start recording
    await page.goto(url);
    
    const sessionId = Date.now().toString();
    recordingSessions.set(sessionId, { browser, context, page });
    
    res.json({ sessionId });
  } catch (error) {
    console.error('Failed to start recording:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop recording session and get recorded steps
app.post('/api/recording/stop', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = recordingSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Recording session not found' });
    }
    
    const { browser, context, page } = session;
    
    // Get recorded steps from the page
    const recordedSteps = await page.evaluate(() => {
      return window.__playwright_recording_steps || [];
    });
    
    // Clean up
    await context.close();
    await browser.close();
    recordingSessions.delete(sessionId);
    
    res.json({ steps: recordedSteps });
  } catch (error) {
    console.error('Failed to stop recording:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute scenario
app.post('/api/scenarios/execute', async (req, res) => {
  try {
    const { url, scenario, headed } = req.body;
    const browser = await chromium.launch({ headless: !headed });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const results = [];
    
    try {
      await page.goto(url);
      
      for (const step of scenario.steps) {
        const result = await executeStep(page, step);
        results.push({
          step: step.description,
          ...result
        });
      }
      
      res.json({ success: true, results });
    } catch (error) {
      res.json({ 
        success: false, 
        error: error.message,
        results 
      });
    } finally {
      await context.close();
      await browser.close();
    }
  } catch (error) {
    console.error('Failed to execute scenario:', error);
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

// Update the executeStep function
async function executeStep(page, step) {
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
        console.log('Performing navigation action...');
        await page.waitForSelector(step.testData.selector, { timeout: 30000 });
        await page.click(step.testData.selector);
        if (step.testData.expectedText) {
          await page.waitForSelector(`text=${step.testData.expectedText}`, { timeout: 30000 });
        }
        break;
    }
    
    return { success: true };
  } catch (error) {
    console.error(`Step failed: ${step.description}`, error);
    return { 
      success: false, 
      error: error.message,
      screenshot: await page.screenshot({ path: `error-${Date.now()}.png` })
    };
  }
}

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 