
export class TreatmentErrorResponse {
  request_id: string;
  log_date: string;
  uln_country_code: string;
  uln_number: string;
  pedigree_country_code: string;
  pedigree_number: string;
  request_state: string;
  is_removed_by_user: boolean;
  flag_type: string;
  flag_start_date: string;
  flag_end_date: string;
  error_message: string;
  error_code: string;
}
