import { analyticsService } from './analyticsService';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'completed';
  variants: ABTestVariant[];
  trafficAllocation: number; // Percentage of users to include in test
  startDate: Date;
  endDate?: Date;
  targetMetric: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // Traffic percentage for this variant
  config: Record<string, any>; // Configuration for this variant
}

export interface ABTestAssignment {
  testId: string;
  variantId: string;
  userId: string;
  assignedAt: Date;
  sticky: boolean; // Whether user should always see the same variant
}

export interface ABTestConfig {
  algorithm?: string;
  parameters?: Record<string, any>;
  displayConfig?: Record<string, any>;
}

class ABTestService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  private assignments: Map<string, ABTestAssignment> = new Map();
  private tests: Map<string, ABTest> = new Map();

  constructor() {
    this.loadAssignments();
  }

  // Load user's test assignments from localStorage
  private loadAssignments(): void {
    try {
      const stored = localStorage.getItem('ab_test_assignments');
      if (stored) {
        const assignments = JSON.parse(stored);
        Object.entries(assignments).forEach(([testId, assignment]) => {
          this.assignments.set(testId, assignment as ABTestAssignment);
        });
      }
    } catch (error) {
      console.error('Failed to load A/B test assignments:', error);
    }
  }

  // Save assignments to localStorage
  private saveAssignments(): void {
    try {
      const assignmentsObj: Record<string, ABTestAssignment> = {};
      this.assignments.forEach((assignment, testId) => {
        assignmentsObj[testId] = assignment;
      });
      localStorage.setItem('ab_test_assignments', JSON.stringify(assignmentsObj));
    } catch (error) {
      console.error('Failed to save A/B test assignments:', error);
    }
  }

  // Get active tests from server
  async getActiveTests(): Promise<ABTest[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ab-tests/active`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch active tests');
      }

      const tests = await response.json();
      
      // Cache tests
      tests.forEach((test: ABTest) => {
        this.tests.set(test.id, test);
      });

      return tests;
    } catch (error) {
      console.error('Failed to get active tests:', error);
      return [];
    }
  }

  // Get user's assignment for a specific test
  async getAssignment(testId: string, userId: string): Promise<ABTestVariant | null> {
    try {
      // Check if user already has an assignment
      const existingAssignment = this.assignments.get(testId);
      if (existingAssignment && existingAssignment.userId === userId) {
        const test = this.tests.get(testId);
        if (test) {
          const variant = test.variants.find(v => v.id === existingAssignment.variantId);
          if (variant) {
            // Track assignment view
            analyticsService.trackABTest(testId, variant.id, 'view', undefined, userId);
            return variant;
          }
        }
      }

      // Get new assignment from server
      const response = await fetch(`${this.baseUrl}/ab-tests/${testId}/assignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        return null;
      }

      const assignment = await response.json();
      
      // Store assignment
      this.assignments.set(testId, assignment);
      this.saveAssignments();

      // Get variant details
      const test = this.tests.get(testId);
      if (test) {
        const variant = test.variants.find(v => v.id === assignment.variantId);
        if (variant) {
          // Track assignment view
          analyticsService.trackABTest(testId, variant.id, 'view', undefined, userId);
          return variant;
        }
      }

      return null;
    } catch (error) {
      console.error('Failed to get A/B test assignment:', error);
      return null;
    }
  }

  // Get configuration for a specific test and user
  async getTestConfig(testId: string, userId: string): Promise<ABTestConfig | null> {
    const variant = await this.getAssignment(testId, userId);
    if (!variant) {
      return null;
    }

    return variant.config as ABTestConfig;
  }

  // Track test interaction
  async trackInteraction(
    testId: string,
    action: 'click' | 'conversion' | 'bounce',
    value?: number,
    userId?: string
  ): Promise<void> {
    const assignment = this.assignments.get(testId);
    if (!assignment) {
      return;
    }

    try {
      // Track locally
      await analyticsService.trackABTest(testId, assignment.variantId, action, value, userId);

      // Also send to server for real-time tracking
      await fetch(`${this.baseUrl}/ab-tests/${testId}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variantId: assignment.variantId,
          action,
          value,
          userId,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to track A/B test interaction:', error);
    }
  }

  // Recommendation A/B testing methods
  async getRecommendationAlgorithm(userId: string): Promise<string> {
    const testId = 'recommendation_algorithm_test';
    const variant = await this.getAssignment(testId, userId);
    
    if (variant && variant.config.algorithm) {
      return variant.config.algorithm;
    }

    // Default algorithm if no test is running
    return 'collaborative_filtering';
  }

  async trackRecommendationClick(
    productId: string,
    position: number,
    userId?: string
  ): Promise<void> {
    const testId = 'recommendation_algorithm_test';
    await this.trackInteraction(testId, 'click', position, userId);
  }

  async trackRecommendationConversion(
    productId: string,
    value: number,
    userId?: string
  ): Promise<void> {
    const testId = 'recommendation_algorithm_test';
    await this.trackInteraction(testId, 'conversion', value, userId);
  }

  // Search A/B testing methods
  async getSearchAlgorithm(userId: string): Promise<string> {
    const testId = 'search_algorithm_test';
    const variant = await this.getAssignment(testId, userId);
    
    if (variant && variant.config.algorithm) {
      return variant.config.algorithm;
    }

    // Default algorithm if no test is running
    return 'elasticsearch_default';
  }

  async trackSearchClick(
    query: string,
    productId: string,
    position: number,
    userId?: string
  ): Promise<void> {
    const testId = 'search_algorithm_test';
    await this.trackInteraction(testId, 'click', position, userId);
  }

  // UI A/B testing methods
  async getUIVariant(testId: string, userId: string): Promise<Record<string, any> | null> {
    const variant = await this.getAssignment(testId, userId);
    return variant?.config.displayConfig || null;
  }

  // Test management (admin functions)
  async createTest(test: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ABTest> {
    try {
      const response = await fetch(`${this.baseUrl}/ab-tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(test),
      });

      if (!response.ok) {
        throw new Error('Failed to create test');
      }

      const createdTest = await response.json();
      this.tests.set(createdTest.id, createdTest);
      return createdTest;
    } catch (error) {
      console.error('Failed to create A/B test:', error);
      throw error;
    }
  }

  async updateTest(testId: string, updates: Partial<ABTest>): Promise<ABTest> {
    try {
      const response = await fetch(`${this.baseUrl}/ab-tests/${testId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update test');
      }

      const updatedTest = await response.json();
      this.tests.set(testId, updatedTest);
      return updatedTest;
    } catch (error) {
      console.error('Failed to update A/B test:', error);
      throw error;
    }
  }

  async deleteTest(testId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/ab-tests/${testId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete test');
      }

      this.tests.delete(testId);
      this.assignments.delete(testId);
      this.saveAssignments();
    } catch (error) {
      console.error('Failed to delete A/B test:', error);
      throw error;
    }
  }

  // Get test results and statistics
  async getTestResults(testId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/ab-tests/${testId}/results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get test results');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get A/B test results:', error);
      throw error;
    }
  }

  // Statistical significance calculation
  calculateStatisticalSignificance(
    variantA: { conversions: number; visitors: number },
    variantB: { conversions: number; visitors: number }
  ): { pValue: number; significant: boolean; confidenceLevel: number } {
    const conversionRateA = variantA.conversions / variantA.visitors;
    const conversionRateB = variantB.conversions / variantB.visitors;
    
    const pooledConversionRate = 
      (variantA.conversions + variantB.conversions) / 
      (variantA.visitors + variantB.visitors);
    
    const standardError = Math.sqrt(
      pooledConversionRate * (1 - pooledConversionRate) * 
      (1 / variantA.visitors + 1 / variantB.visitors)
    );
    
    const zScore = Math.abs(conversionRateA - conversionRateB) / standardError;
    
    // Approximate p-value calculation (simplified)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));
    
    return {
      pValue,
      significant: pValue < 0.05,
      confidenceLevel: (1 - pValue) * 100
    };
  }

  // Normal cumulative distribution function (approximation)
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    
    if (x > 0) {
      return 1 - p;
    } else {
      return p;
    }
  }

  // Clear all assignments (for testing)
  clearAssignments(): void {
    this.assignments.clear();
    localStorage.removeItem('ab_test_assignments');
  }

  // Get current assignments
  getCurrentAssignments(): Map<string, ABTestAssignment> {
    return new Map(this.assignments);
  }
}

export const abTestService = new ABTestService();