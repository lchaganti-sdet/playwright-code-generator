import { chromium } from '@playwright/test';

export interface TestStep {
  description: string;
  type: 'login' | 'navigation' | 'action';
  testData: {
    username?: string;
    password?: string;
    selector?: string;
    expectedText?: string;
  };
}

export interface TestScenario {
  name: string;
  steps: TestStep[];
}

export interface TestStepResult {
  testName: string;
  status: 'passed' | 'failed' | 'running';
  duration: number;
  error?: string;
  currentAction?: string;
  screenshot?: string;
}

export interface TestScenarioResult {
  scenarioName: string;
  steps: TestStepResult[];
}

export interface TestResult {
  status: 'success' | 'error';
  details: TestScenarioResult[];
  screenshots: { [key: string]: string };
}

export class TestRunner {
  private apiUrl = 'http://localhost:3002/api/run-tests';

  async runTests(url: string, headed: boolean, selectedScenarios?: string[]): Promise<TestResult> {
    try {
      // Ensure URL has protocol and remove www if present
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      url = url.replace(/^https?:\/\//, 'https://').replace(/^www\./, '');

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          headed,
          selectedScenarios,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to run tests');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error running tests:', error);
      throw error;
    }
  }
} 