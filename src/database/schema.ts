import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 2,
  tables: [
    tableSchema({
      name: 'companies',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'nip', type: 'string' },
        { name: 'regon', type: 'string', isOptional: true },
        { name: 'street', type: 'string' },
        { name: 'city', type: 'string' },
        { name: 'postal_code', type: 'string' },
        { name: 'country', type: 'string' },
        { name: 'vat_status', type: 'string' },
        { name: 'tax_office', type: 'string' },
        { name: 'is_active', type: 'boolean' },
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'last_sync', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'invoices',
      columns: [
        { name: 'invoice_number', type: 'string' },
        { name: 'type', type: 'string' }, // 'sales' | 'purchase'
        { name: 'status', type: 'string' }, // 'draft' | 'sent' | 'paid' | 'overdue'
        { name: 'issue_date', type: 'number' },
        { name: 'due_date', type: 'number' },
        { name: 'company_id', type: 'string' },
        { name: 'contractor_name', type: 'string' },
        { name: 'contractor_nip', type: 'string' },
        { name: 'contractor_address', type: 'string' },
        { name: 'net_amount', type: 'number' },
        { name: 'vat_amount', type: 'number' },
        { name: 'gross_amount', type: 'number' },
        { name: 'currency', type: 'string' },
        { name: 'payment_method', type: 'string' },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'ksef_status', type: 'string', isOptional: true },
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'last_sync', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'invoice_items',
      columns: [
        { name: 'invoice_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'quantity', type: 'number' },
        { name: 'unit', type: 'string' },
        { name: 'unit_price', type: 'number' },
        { name: 'net_value', type: 'number' },
        { name: 'vat_rate', type: 'number' },
        { name: 'vat_amount', type: 'number' },
        { name: 'gross_value', type: 'number' },
        { name: 'order_index', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'costs',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'amount', type: 'number' },
        { name: 'category', type: 'string' },
        { name: 'date', type: 'number' },
        { name: 'company_id', type: 'string' },
        { name: 'receipt_path', type: 'string', isOptional: true },
        { name: 'ocr_data', type: 'string', isOptional: true }, // JSON string
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'last_sync', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'declarations',
      columns: [
        { name: 'type', type: 'string' }, // 'vat7' | 'jpk_v7' | 'zus'
        { name: 'period', type: 'string' },
        { name: 'year', type: 'number' },
        { name: 'status', type: 'string' }, // 'draft' | 'submitted' | 'accepted'
        { name: 'company_id', type: 'string' },
        { name: 'data', type: 'string' }, // JSON string
        { name: 'submission_id', type: 'string', isOptional: true },
        { name: 'submitted_at', type: 'number', isOptional: true },
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'last_sync', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'sync_queue',
      columns: [
        { name: 'table_name', type: 'string' },
        { name: 'record_id', type: 'string' },
        { name: 'operation', type: 'string' }, // 'create' | 'update' | 'delete'
        { name: 'data', type: 'string' }, // JSON string
        { name: 'status', type: 'string' }, // 'pending' | 'syncing' | 'synced' | 'error'
        { name: 'error_message', type: 'string', isOptional: true },
        { name: 'retry_count', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'zus_employees',
      columns: [
        { name: 'first_name', type: 'string' },
        { name: 'last_name', type: 'string' },
        { name: 'pesel', type: 'string', isOptional: true },
        { name: 'birth_date', type: 'number' },
        { name: 'address', type: 'string' },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'employment_date', type: 'number' },
        { name: 'termination_date', type: 'number', isOptional: true },
        { name: 'insurance_start_date', type: 'number' },
        { name: 'is_owner', type: 'boolean' },
        { name: 'contract_type', type: 'string' },
        { name: 'salary_basis', type: 'number' },
        { name: 'company_id', type: 'string' },
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'last_sync', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'zus_registrations',
      columns: [
        { name: 'form_type', type: 'string' }, // 'ZUA' | 'ZZA' | 'ZWUA'
        { name: 'registration_date', type: 'number' },
        { name: 'insurance_types', type: 'string' }, // JSON string
        { name: 'contribution_basis', type: 'number' },
        { name: 'status', type: 'string' }, // 'draft' | 'submitted' | 'confirmed' | 'cancelled'
        { name: 'zus_reference_number', type: 'string', isOptional: true },
        { name: 'upo_number', type: 'string', isOptional: true },
        { name: 'upo_date', type: 'number', isOptional: true },
        { name: 'employee_id', type: 'string' },
        { name: 'company_id', type: 'string' },
        { name: 'data', type: 'string' }, // JSON string
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'last_sync', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'zus_reports',
      columns: [
        { name: 'report_type', type: 'string' }, // 'RCA' | 'RZA' | 'RSA' | 'DRA' | 'RPA'
        { name: 'period', type: 'string' },
        { name: 'report_date', type: 'number' },
        { name: 'total_employees', type: 'number' },
        { name: 'total_contributions', type: 'number' },
        { name: 'status', type: 'string' }, // 'draft' | 'submitted' | 'confirmed' | 'corrected'
        { name: 'zus_reference_number', type: 'string', isOptional: true },
        { name: 'upo_number', type: 'string', isOptional: true },
        { name: 'upo_date', type: 'number', isOptional: true },
        { name: 'company_id', type: 'string' },
        { name: 'data', type: 'string' }, // JSON string
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'last_sync', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'zus_contributions',
      columns: [
        { name: 'period', type: 'string' },
        { name: 'contribution_date', type: 'number' },
        { name: 'emerytalna_employer', type: 'number' },
        { name: 'emerytalna_employee', type: 'number' },
        { name: 'rentowa_employer', type: 'number' },
        { name: 'rentowa_employee', type: 'number' },
        { name: 'chorobowa_employee', type: 'number' },
        { name: 'wypadkowa_employer', type: 'number' },
        { name: 'zdrowotna_employee', type: 'number' },
        { name: 'zdrowotna_deductible', type: 'number' },
        { name: 'fp_employee', type: 'number' },
        { name: 'fgsp_employee', type: 'number' },
        { name: 'basis_emerytalna_rentowa', type: 'number' },
        { name: 'basis_chorobowa', type: 'number' },
        { name: 'basis_zdrowotna', type: 'number' },
        { name: 'basis_fp_fgsp', type: 'number' },
        { name: 'zus_form_type', type: 'string', isOptional: true },
        { name: 'status', type: 'string' }, // 'calculated' | 'submitted' | 'confirmed'
        { name: 'employee_id', type: 'string', isOptional: true },
        { name: 'report_id', type: 'string', isOptional: true },
        { name: 'company_id', type: 'string' },
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'last_sync', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});