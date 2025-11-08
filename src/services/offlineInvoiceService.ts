import { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import Invoice from '../database/models/Invoice';
import InvoiceItem from '../database/models/InvoiceItem';
import { mobileErrorHandler, handleSyncError } from './mobileErrorHandler';

export interface OfflineInvoiceData {
  id?: string;
  invoiceNumber: string;
  type: string;
  status: string;
  issueDate: number;
  dueDate: number;
  companyId: string;
  contractorName: string;
  contractorNip: string;
  contractorAddress: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  currency: string;
  paymentMethod: string;
  notes: string;
  items: OfflineInvoiceItemData[];
  serverId?: string;
  lastSync?: number;
  workflowId?: string;
  workflowStatus?: string;
}

export interface OfflineInvoiceItemData {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  gtu?: string;
  category?: string;
}

export interface WorkflowOperation {
  id: string;
  type: 'create_workflow' | 'execute_step' | 'cancel_workflow';
  workflowId?: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

class OfflineInvoiceService {
  private static instance: OfflineInvoiceService;
  private database: Database;
  private syncQueue: OfflineInvoiceData[] = [];
  private workflowQueue: WorkflowOperation[] = [];

  constructor(database: Database) {
    this.database = database;
  }

  static getInstance(database?: Database): OfflineInvoiceService {
    if (!OfflineInvoiceService.instance) {
      if (!database) {
        throw new Error('Database instance required for first initialization');
      }
      OfflineInvoiceService.instance = new OfflineInvoiceService(database);
    }
    return OfflineInvoiceService.instance;
  }

  // Save invoice for offline use
  async saveInvoiceOffline(invoiceData: OfflineInvoiceData): Promise<string> {
    try {
      const invoiceId = await this.database.write(async () => {
        const invoice = await this.database.get<Invoice>('invoices').create(invoice => {
          invoice.invoiceNumber = invoiceData.invoiceNumber;
          invoice.type = invoiceData.type;
          invoice.status = invoiceData.status;
          invoice.issueDate = invoiceData.issueDate;
          invoice.dueDate = invoiceData.dueDate;
          invoice.companyId = invoiceData.companyId;
          invoice.contractorName = invoiceData.contractorName;
          invoice.contractorNip = invoiceData.contractorNip;
          invoice.contractorAddress = invoiceData.contractorAddress;
          invoice.netAmount = invoiceData.netAmount;
          invoice.vatAmount = invoiceData.vatAmount;
          invoice.grossAmount = invoiceData.grossAmount;
          invoice.currency = invoiceData.currency;
          invoice.paymentMethod = invoiceData.paymentMethod;
          invoice.notes = invoiceData.notes;
          invoice.serverId = invoiceData.serverId || '';
          invoice.lastSync = invoiceData.lastSync || Date.now();
        });

        // Save invoice items
        for (let i = 0; i < invoiceData.items.length; i++) {
          const itemData = invoiceData.items[i];
          await this.database.get<InvoiceItem>('invoice_items').create(item => {
            item.invoiceId = invoice.id;
            item.name = itemData.description; // Use name field as per model
            item.description = itemData.description;
            item.quantity = itemData.quantity;
            item.unit = 'szt'; // Default unit
            item.unitPrice = itemData.unitPrice;
            item.netValue = itemData.quantity * itemData.unitPrice;
            item.vatRate = itemData.vatRate;
            item.vatAmount = (itemData.quantity * itemData.unitPrice * itemData.vatRate) / 100;
            item.grossValue = itemData.quantity * itemData.unitPrice + item.vatAmount;
            item.orderIndex = i;
          });
        }

        return invoice.id;
      });

      return invoiceId;
    } catch (error) {
      mobileErrorHandler.handleError(error, 'saveInvoiceOffline');
      throw error;
    }
  }

  // Get offline invoices
  async getOfflineInvoices(companyId: string): Promise<Invoice[]> {
    try {
      const invoices = await this.database
        .get<Invoice>('invoices')
        .query(
          Q.where('company_id', companyId),
          Q.sortBy('created_at', Q.desc)
        )
        .fetch();

      return invoices;
    } catch (error) {
      mobileErrorHandler.handleError(error, 'getOfflineInvoices');
      return [];
    }
  }

  // Queue invoice for sync when online
  queueForSync(invoiceData: OfflineInvoiceData): void {
    this.syncQueue.push({
      ...invoiceData,
      lastSync: Date.now(),
    });
  }

  // Queue workflow operation for offline execution
  queueWorkflowOperation(operation: Omit<WorkflowOperation, 'id' | 'timestamp' | 'retryCount'>): void {
    const workflowOp: WorkflowOperation = {
      ...operation,
      id: `workflow_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retryCount: 0,
    };
    this.workflowQueue.push(workflowOp);
  }

  // Get pending sync items
  getPendingSyncItems(): OfflineInvoiceData[] {
    return [...this.syncQueue];
  }

  // Get pending workflow operations
  getPendingWorkflowOperations(): WorkflowOperation[] {
    return [...this.workflowQueue];
  }

  // Remove from sync queue after successful sync
  removeFromSyncQueue(invoiceId: string): void {
    this.syncQueue = this.syncQueue.filter(item => item.id !== invoiceId);
  }

  // Remove workflow operation from queue
  removeWorkflowOperation(operationId: string): void {
    this.workflowQueue = this.workflowQueue.filter(op => op.id !== operationId);
  }

  // Sync offline invoices with server
  async syncWithServer(
    syncFunction: (invoiceData: OfflineInvoiceData) => Promise<any>
  ): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    for (const invoiceData of this.syncQueue) {
      try {
        await syncFunction(invoiceData);

        // Update local invoice with server ID
        if (invoiceData.id) {
          await this.database.write(async () => {
            const invoice = await this.database.get<Invoice>('invoices').find(invoiceData.id!);
            await invoice.update(invoiceRecord => {
              (invoiceRecord as any).serverId = 'synced'; // In real app, get actual server ID
              (invoiceRecord as any).lastSync = Date.now();
            });
          });
        }

        this.removeFromSyncQueue(invoiceData.id || '');
        synced++;
      } catch (error) {
        handleSyncError(error, 'syncInvoice');
        failed++;
      }
    }

    return { synced, failed };
  }

  // Sync workflow operations with server
  async syncWorkflowOperations(
    syncFunction: (operation: WorkflowOperation) => Promise<any>
  ): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    for (const operation of this.workflowQueue) {
      try {
        await syncFunction(operation);
        this.removeWorkflowOperation(operation.id);
        synced++;
      } catch (error) {
        handleSyncError(error, 'syncWorkflowOperation');
        // Increment retry count
        operation.retryCount++;
        // Remove if too many retries
        if (operation.retryCount >= 3) {
          this.removeWorkflowOperation(operation.id);
        }
        failed++;
      }
    }

    return { synced, failed };
  }

  // Check if device is online
  async isOnline(): Promise<boolean> {
    try {
      // Simple ping to check connectivity with AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Auto-sync when coming back online
  async attemptAutoSync(
    syncFunction: (invoiceData: OfflineInvoiceData) => Promise<any>,
    workflowSyncFunction?: (operation: WorkflowOperation) => Promise<any>
  ): Promise<void> {
    if (await this.isOnline()) {
      // Sync invoices
      if (this.syncQueue.length > 0) {
        const invoiceResult = await this.syncWithServer(syncFunction);

        if (invoiceResult.synced > 0) {
          console.log(`Synced ${invoiceResult.synced} invoices`);
        }

        if (invoiceResult.failed > 0) {
          console.warn(`Failed to sync ${invoiceResult.failed} invoices`);
        }
      }

      // Sync workflow operations
      if (workflowSyncFunction && this.workflowQueue.length > 0) {
        const workflowResult = await this.syncWorkflowOperations(workflowSyncFunction);

        if (workflowResult.synced > 0) {
          console.log(`Synced ${workflowResult.synced} workflow operations`);
        }

        if (workflowResult.failed > 0) {
          console.warn(`Failed to sync ${workflowResult.failed} workflow operations`);
        }
      }
    }
  }

  // Clear old offline data (older than 30 days)
  async clearOldOfflineData(): Promise<void> {
    try {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

      await this.database.write(async () => {
        const oldInvoices = await this.database
          .get<Invoice>('invoices')
          .query(
            Q.where('last_sync', Q.lt(thirtyDaysAgo)),
            Q.where('server_id', Q.eq(null))
          )
          .fetch();

        for (const invoice of oldInvoices) {
          await invoice.markAsDeleted();
        }
      });
    } catch (error) {
      mobileErrorHandler.handleError(error, 'clearOldOfflineData');
    }
  }
}

export default OfflineInvoiceService;