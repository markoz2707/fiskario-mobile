import { Model } from '@nozbe/watermelondb';
import { field, date, immutableRelation } from '@nozbe/watermelondb/decorators';

export default class ZUSRegistration extends Model {
  static table = 'zus_registrations';

  @field('form_type') formType!: string;
  @date('registration_date') registrationDate!: Date;
  @field('insurance_types') insuranceTypes!: string;
  @field('contribution_basis') contributionBasis!: number;
  @field('status') status!: string;
  @field('zus_reference_number') zusReferenceNumber?: string;
  @field('upo_number') upoNumber?: string;
  @date('upo_date') upoDate?: Date;
  @field('employee_id') employeeId!: string;
  @field('company_id') companyId!: string;
  @field('data') data!: string;
  @field('server_id') serverId?: string;
  @date('last_sync') lastSync?: Date;
}