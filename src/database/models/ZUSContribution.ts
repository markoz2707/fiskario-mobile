import { Model } from '@nozbe/watermelondb';
import { field, date } from '@nozbe/watermelondb/decorators';

export default class ZUSContribution extends Model {
  static table = 'zus_contributions';

  @field('period') period!: string;
  @date('contribution_date') contributionDate!: Date;
  @field('emerytalna_employer') emerytalnaEmployer!: number;
  @field('emerytalna_employee') emerytalnaEmployee!: number;
  @field('rentowa_employer') rentowaEmployer!: number;
  @field('rentowa_employee') rentowaEmployee!: number;
  @field('chorobowa_employee') chorobowaEmployee!: number;
  @field('wypadkowa_employer') wypadkowaEmployer!: number;
  @field('zdrowotna_employee_amount') zdrowotnaEmployee!: number;
  @field('zdrowotna_deductible') zdrowotnaDeductible!: number;
  @field('fp_employee') fpEmployee!: number;
  @field('fgsp_employee') fgspEmployee!: number;
  @field('basis_emerytalna_rentowa') basisEmerytalnaRentowa!: number;
  @field('basis_chorobowa') basisChorobowa!: number;
  @field('basis_zdrowotna') basisZdrowotna!: number;
  @field('basis_fp_fgsp') basisFPFGSP!: number;
  @field('zus_form_type') zusFormType?: string;
  @field('status') status!: string;
  @field('employee_id') employeeId?: string;
  @field('report_id') reportId?: string;
  @field('company_id') companyId!: string;
  @field('server_id') serverId?: string;
  @date('last_sync') lastSync?: Date;
}