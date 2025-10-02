import { Model } from '@nozbe/watermelondb';
import { field, date, relation } from '@nozbe/watermelondb/decorators';

export default class InvoiceItem extends Model {
  static table = 'invoice_items';

  @field('invoice_id') invoiceId!: string;
  @field('name') name!: string;
  @field('description') description!: string;
  @field('quantity') quantity!: number;
  @field('unit') unit!: string;
  @field('unit_price') unitPrice!: number;
  @field('net_value') netValue!: number;
  @field('vat_rate') vatRate!: number;
  @field('vat_amount') vatAmount!: number;
  @field('gross_value') grossValue!: number;
  @field('order_index') orderIndex!: number;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @relation('invoices', 'invoice_id') invoice!: any;
}