import { database } from '../database/database';
import { mobileErrorHandler } from './mobileErrorHandler';
import OfflineInvoiceService, { WorkflowOperation } from './offlineInvoiceService';

export interface WorkflowStatus {
  workflowId: string;
  status: 'draft' | 'pending_validation' | 'validation_failed' | 'pending_approval' | 'approved' | 'processing' | 'completed' | 'failed' | 'cancelled';
  currentStep?: string;
  progress: number;
  lastUpdated: number;
}

class WorkflowService {
  private static instance: WorkflowService;
  private offlineService: OfflineInvoiceService;

  constructor() {
    this.offlineService = OfflineInvoiceService.getInstance(database);
  }

  static getInstance(): WorkflowService {
    if (!WorkflowService.instance) {
      WorkflowService.instance = new WorkflowService();
    }
    return WorkflowService.instance;
  }

  // Create workflow with offline support
  async createWorkflow(workflowData: any, isOnline: boolean = true): Promise<string> {
    try {
      if (isOnline) {
        // Online: Call API directly
        const response = await fetch('/api/workflow-automation/workflows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add auth headers
          },
          body: JSON.stringify(workflowData),
        });

        if (!response.ok) {
          throw new Error('Failed to create workflow');
        }

        const result = await response.json();
        return result.data.id;
      } else {
        // Offline: Queue for later sync
        const operation: Omit<WorkflowOperation, 'id' | 'timestamp' | 'retryCount'> = {
          type: 'create_workflow',
          data: workflowData,
        };

        this.offlineService.queueWorkflowOperation(operation);

        // Return temporary ID
        return `temp_${Date.now()}`;
      }
    } catch (error) {
      mobileErrorHandler.handleError(error, 'createWorkflow');
      throw error;
    }
  }

  // Execute workflow step with offline support
  async executeWorkflowStep(workflowId: string, stepData: any, isOnline: boolean = true): Promise<void> {
    try {
      if (isOnline) {
        // Online: Call API directly
        const response = await fetch(`/api/workflow-automation/workflows/${workflowId}/execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Add auth headers
          },
          body: JSON.stringify(stepData),
        });

        if (!response.ok) {
          throw new Error('Failed to execute workflow step');
        }
      } else {
        // Offline: Queue for later sync
        const operation: Omit<WorkflowOperation, 'id' | 'timestamp' | 'retryCount'> = {
          type: 'execute_step',
          workflowId,
          data: stepData,
        };

        this.offlineService.queueWorkflowOperation(operation);
      }
    } catch (error) {
      mobileErrorHandler.handleError(error, 'executeWorkflowStep');
      throw error;
    }
  }

  // Get workflow status
  async getWorkflowStatus(workflowId: string): Promise<WorkflowStatus | null> {
    try {
      // Check local cache/database first
      // For now, return mock data
      return {
        workflowId,
        status: 'processing',
        currentStep: 'validation',
        progress: 50,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      mobileErrorHandler.handleError(error, 'getWorkflowStatus');
      return null;
    }
  }

  // Cancel workflow
  async cancelWorkflow(workflowId: string, isOnline: boolean = true): Promise<void> {
    try {
      if (isOnline) {
        // Online: Call API directly
        const response = await fetch(`/api/workflow-automation/workflows/${workflowId}/cancel`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            // Add auth headers
          },
        });

        if (!response.ok) {
          throw new Error('Failed to cancel workflow');
        }
      } else {
        // Offline: Queue for later sync
        const operation: Omit<WorkflowOperation, 'id' | 'timestamp' | 'retryCount'> = {
          type: 'cancel_workflow',
          workflowId,
          data: {},
        };

        this.offlineService.queueWorkflowOperation(operation);
      }
    } catch (error) {
      mobileErrorHandler.handleError(error, 'cancelWorkflow');
      throw error;
    }
  }

  // Get pending workflow operations
  getPendingOperations(): WorkflowOperation[] {
    return this.offlineService.getPendingWorkflowOperations();
  }

  // Sync pending operations
  async syncPendingOperations(): Promise<{ synced: number; failed: number }> {
    const operations = this.getPendingOperations();

    if (operations.length === 0) {
      return { synced: 0, failed: 0 };
    }

    return this.offlineService.syncWorkflowOperations(async (operation: WorkflowOperation) => {
      // Execute the workflow operation based on type
      switch (operation.type) {
        case 'create_workflow':
          return this.executeCreateWorkflow(operation.data);
        case 'execute_step':
          return this.executeWorkflowStep(operation.workflowId!, operation.data, true);
        case 'cancel_workflow':
          return this.cancelWorkflow(operation.workflowId!, true);
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }
    });
  }

  // Execute create workflow operation
  private async executeCreateWorkflow(workflowData: any): Promise<any> {
    const response = await fetch('/api/workflow-automation/workflows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers
      },
      body: JSON.stringify(workflowData),
    });

    if (!response.ok) {
      throw new Error('Failed to create workflow');
    }

    return response.json();
  }

  // Get workflow queue statistics
  getQueueStats(): { pendingOperations: number; oldestOperation?: number } {
    const operations = this.getPendingOperations();
    return {
      pendingOperations: operations.length,
      oldestOperation: operations.length > 0 ? Math.min(...operations.map(op => op.timestamp)) : undefined,
    };
  }

  // Clear old operations (older than specified days)
  clearOldOperations(daysOld: number = 7): void {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const operations = this.offlineService.getPendingWorkflowOperations();

    operations.forEach(op => {
      if (op.timestamp < cutoffTime) {
        this.offlineService.removeWorkflowOperation(op.id);
      }
    });
  }
}

export default WorkflowService;