import { Model } from '@nozbe/watermelondb';
import { field, date, children, immutableRelation } from '@nozbe/watermelondb/decorators';

export default class ZUSEmployee extends Model {
  static table = 'zus_employees';

  @field('first_name') firstName!: string;
  @field('last_name') lastName!: string;
  @field('pesel') pesel?: string;
  @date('birth_date') birthDate!: Date;
  @field('address') address!: string;
  @field('phone') phone?: string;
  @field('email') email?: string;
  @date('employment_date') employmentDate!: Date;
  @date('termination_date') terminationDate?: Date;
  @date('insurance_start_date') insuranceStartDate!: Date;
  @field('is_owner') isOwner!: boolean;
  @field('contract_type') contractType!: string;
  @field('salary_basis') salaryBasis!: number;
  @field('company_id') companyId!: string;
  @field('server_id') serverId?: string;
  @date('last_sync') lastSync?: Date;

  @children('zus_registrations') registrations!: any;
  @children('zus_contributions') contributions!: any;
}