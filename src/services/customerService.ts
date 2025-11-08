import { Database } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import Customer from '../database/models/Customer';
import { mobileErrorHandler } from './mobileErrorHandler';

export interface CustomerData {
  id?: string;
  name: string;
  nip: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  email: string;
  phone: string;
  isActive: boolean;
  paymentTerms: number;
  notes: string;
  serverId?: string;
  lastSync?: number;
}

class CustomerService {
  private static instance: CustomerService;
  private database: Database;
  private cache: Map<string, { data: Customer[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(database: Database) {
    this.database = database;
  }

  static getInstance(database?: Database): CustomerService {
    if (!CustomerService.instance) {
      if (!database) {
        throw new Error('Database instance required for first initialization');
      }
      CustomerService.instance = new CustomerService(database);
    }
    return CustomerService.instance;
  }

  // Create new customer
  async createCustomer(customerData: CustomerData): Promise<string> {
    try {
      const customerId = await this.database.write(async () => {
        const customer = await this.database.get<Customer>('customers').create(customer => {
          customer.name = customerData.name;
          customer.nip = customerData.nip;
          customer.address = customerData.address;
          customer.city = customerData.city;
          customer.postalCode = customerData.postalCode;
          customer.country = customerData.country;
          customer.email = customerData.email;
          customer.phone = customerData.phone;
          customer.isActive = customerData.isActive;
          customer.paymentTerms = customerData.paymentTerms;
          customer.notes = customerData.notes;
          (customer as any).serverId = customerData.serverId;
          customer.lastSync = customerData.lastSync || Date.now();
        });

        return customer.id;
      });

      // Invalidate cache for the company (assuming we can get companyId from context)
      // For now, we'll clear all customer caches when a new customer is created
      this.cache.clear();

      return customerId;
    } catch (error) {
      mobileErrorHandler.handleError(error, 'createCustomer');
      throw error;
    }
  }

  // Get all customers for a company with caching
  async getCustomers(companyId: string): Promise<Customer[]> {
    try {
      // Check cache first
      const cacheKey = `customers_${companyId}`;
      const cached = this.cache.get(cacheKey);

      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        return cached.data;
      }

      const customers = await this.database
        .get<Customer>('customers')
        .query(
          Q.where('company_id', companyId),
          Q.where('is_active', true),
          Q.sortBy('name', Q.asc)
        )
        .fetch();

      // Cache the result
      this.cache.set(cacheKey, {
        data: customers,
        timestamp: Date.now()
      });

      return customers;
    } catch (error) {
      mobileErrorHandler.handleError(error, 'getCustomers');
      return [];
    }
  }

  // Get customer by ID
  async getCustomerById(customerId: string): Promise<Customer | null> {
    try {
      const customer = await this.database
        .get<Customer>('customers')
        .find(customerId);

      return customer;
    } catch (error) {
      mobileErrorHandler.handleError(error, 'getCustomerById');
      return null;
    }
  }

  // Update customer
  async updateCustomer(customerId: string, customerData: Partial<CustomerData>): Promise<void> {
    try {
      await this.database.write(async () => {
        const customer = await this.database.get<Customer>('customers').find(customerId);
        await customer.update(customerRecord => {
          if (customerData.name !== undefined) (customerRecord as any).name = customerData.name;
          if (customerData.nip !== undefined) (customerRecord as any).nip = customerData.nip;
          if (customerData.address !== undefined) (customerRecord as any).address = customerData.address;
          if (customerData.city !== undefined) (customerRecord as any).city = customerData.city;
          if (customerData.postalCode !== undefined) (customerRecord as any).postalCode = customerData.postalCode;
          if (customerData.country !== undefined) (customerRecord as any).country = customerData.country;
          if (customerData.email !== undefined) (customerRecord as any).email = customerData.email;
          if (customerData.phone !== undefined) (customerRecord as any).phone = customerData.phone;
          if (customerData.isActive !== undefined) (customerRecord as any).isActive = customerData.isActive;
          if (customerData.paymentTerms !== undefined) (customerRecord as any).paymentTerms = customerData.paymentTerms;
          if (customerData.notes !== undefined) (customerRecord as any).notes = customerData.notes;
          (customerRecord as any).lastSync = Date.now();
        });
      });

      // Invalidate cache for the company
      const customer = await this.getCustomerById(customerId);
      if (customer) {
        const cacheKey = `customers_${(customer as any).companyId}`;
        this.cache.delete(cacheKey);
      }
    } catch (error) {
      mobileErrorHandler.handleError(error, 'updateCustomer');
      throw error;
    }
  }

  // Delete customer (soft delete)
  async deleteCustomer(customerId: string): Promise<void> {
    try {
      await this.database.write(async () => {
        const customer = await this.database.get<Customer>('customers').find(customerId);
        await customer.update(customerRecord => {
          (customerRecord as any).isActive = false;
          (customerRecord as any).lastSync = Date.now();
        });
      });

      // Invalidate cache for the company
      const customer = await this.getCustomerById(customerId);
      if (customer) {
        const cacheKey = `customers_${(customer as any).companyId}`;
        this.cache.delete(cacheKey);
      }
    } catch (error) {
      mobileErrorHandler.handleError(error, 'deleteCustomer');
      throw error;
    }
  }

  // Search customers by name or NIP
  async searchCustomers(companyId: string, searchTerm: string): Promise<Customer[]> {
    try {
      const customers = await this.database
        .get<Customer>('customers')
        .query(
          Q.where('company_id', companyId),
          Q.where('is_active', true),
          Q.or(
            Q.where('name', Q.like(`%${searchTerm}%`)),
            Q.where('nip', Q.like(`%${searchTerm}%`))
          ),
          Q.sortBy('name', Q.asc)
        )
        .fetch();

      return customers;
    } catch (error) {
      mobileErrorHandler.handleError(error, 'searchCustomers');
      return [];
    }
  }

  // Validate NIP number (Polish tax identification number)
  validateNIP(nip: string): boolean {
    if (!nip || nip.length !== 10) {
      return false;
    }

    // Remove any non-digit characters
    const cleanNIP = nip.replace(/\D/g, '');

    if (cleanNIP.length !== 10) {
      return false;
    }

    // Polish NIP validation algorithm
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanNIP[i]) * weights[i];
    }

    const checksum = sum % 11;
    const lastDigit = parseInt(cleanNIP[9]);

    return (checksum === lastDigit) || (checksum === 10 && lastDigit === 0);
  }

  // Format customer data for display
  formatCustomerForDisplay(customer: Customer): {
    displayName: string;
    fullAddress: string;
    contactInfo: string;
  } {
    return {
      displayName: customer.name,
      fullAddress: `${customer.address}, ${customer.postalCode} ${customer.city}, ${customer.country}`,
      contactInfo: `NIP: ${customer.nip} | ${customer.email} | ${customer.phone}`,
    };
  }

  // Get customers with overdue payments
  async getCustomersWithOverduePayments(companyId: string): Promise<Customer[]> {
    try {
      // This would require joining with invoices and checking due dates
      // For now, return empty array as it requires more complex queries
      return [];
    } catch (error) {
      mobileErrorHandler.handleError(error, 'getCustomersWithOverduePayments');
      return [];
    }
  }

  // Sync customers with server
  async syncWithServer(
    serverCustomers: any[],
    companyId: string
  ): Promise<{ synced: number; failed: number }> {
    let synced = 0;
    let failed = 0;

    try {
      for (const serverCustomer of serverCustomers) {
        try {
          const existingCustomer = await this.database
            .get<Customer>('customers')
            .query(
              Q.where('company_id', companyId),
              Q.where('server_id', serverCustomer.id)
            )
            .fetch();

          if (existingCustomer.length > 0) {
            // Update existing customer
            await this.updateCustomer(existingCustomer[0].id, {
              name: serverCustomer.name,
              nip: serverCustomer.nip,
              address: serverCustomer.address,
              city: serverCustomer.city,
              postalCode: serverCustomer.postal_code,
              country: serverCustomer.country,
              email: serverCustomer.email,
              phone: serverCustomer.phone,
              isActive: serverCustomer.is_active,
              paymentTerms: serverCustomer.payment_terms,
              notes: serverCustomer.notes,
              serverId: serverCustomer.id,
              lastSync: Date.now(),
            });
          } else {
            // Create new customer
            await this.createCustomer({
              name: serverCustomer.name,
              nip: serverCustomer.nip,
              address: serverCustomer.address,
              city: serverCustomer.city,
              postalCode: serverCustomer.postal_code,
              country: serverCustomer.country,
              email: serverCustomer.email,
              phone: serverCustomer.phone,
              isActive: serverCustomer.is_active,
              paymentTerms: serverCustomer.payment_terms,
              notes: serverCustomer.notes,
              serverId: serverCustomer.id,
              lastSync: Date.now(),
            });
          }

          synced++;
        } catch (error) {
          console.error('Failed to sync customer:', serverCustomer.id, error);
          failed++;
        }
      }

      // Clear cache after sync
      const cacheKey = `customers_${companyId}`;
      this.cache.delete(cacheKey);

      return { synced, failed };
    } catch (error) {
      mobileErrorHandler.handleError(error, 'syncCustomersWithServer');
      return { synced: 0, failed: serverCustomers.length };
    }
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats for debugging
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default CustomerService;