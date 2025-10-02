import { Model } from '@nozbe/watermelondb';
import { field, date, relation, children } from '@nozbe/watermelondb/decorators';

export default class Invoice extends Model {
  static table = 'invoices';

  @field('invoice_number') invoiceNumber!: string;
  @field('type') type!: string;
  @field('status') status!: string;
  @field('issue_date') issueDate!: number;
  @field('due_date') dueDate!: number;
  @field('company_id') companyId!: string;
  @field('contractor_name') contractorName!: string;
  @field('contractor_nip') contractorNip!: string;
  @field('contractor_address') contractorAddress!: string;
  @field('net_amount') netAmount!: number;
  @field('vat_amount') vatAmount!: number;
  @field('gross_amount') grossAmount!: number;
  @field('currency') currency!: string;
  @field('payment_method') paymentMethod!: string;
  @field('notes') notes!: string;
  @field('ksef_status') ksefStatus!: string;
  @field('server_id') serverId!: string;
  @field('last_sync') lastSync!: number;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @relation('companies', 'company_id') company!: any;
  @children('invoice_items') items!: any[];
}