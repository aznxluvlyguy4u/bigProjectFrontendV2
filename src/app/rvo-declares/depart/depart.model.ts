import {HistoryResponseModel} from '../../shared/components/historyerrorinfo/history-response.model';
import {Animal} from '../../shared/models/animal.model';

class Depart {
  public is_export_animal: boolean;
  public ubn_new_owner: string;
  public depart_date: string;
  public reason_of_depart: string;
  public certificate_number: string;
  public animal: Animal = new Animal();
}

export class DepartRequest extends Depart {
}

export class DepartChangeResponse extends Depart implements HistoryResponseModel {
  public request_id: string;
  public message_number: string;
  public log_date: string;
  public uln_country_code: string;
  public uln_number: string;
  public uln: string;
  public pedigree_country_code: string;
  public pedigree_number: string;
  public pedigree: string;
  public work_number: string;
  public reason_of_depart: string;
  public request_state: string;
  error_code: string;
  error_message: string;
}

export class DepartErrorResponse extends Depart {
  public request_id: string;
  public message_number: string;
  public log_date: string;
  public uln_country_code: string;
  public uln_number: string;
  public uln: string;
  public pedigree_country_code: string;
  public pedigree_number: string;
  public pedigree: string;
  public work_number: string;
  public error_code: string;
  public error_message: string;
  public reason_of_depart: string;
  public request_state: string;
  public is_removed_by_user: boolean;
  public animal: Animal;
}

export const DEPART_REASON_OF_DEPART = [
  'NO REASON',
  'BREEDING/FARM',
  'RENT',
  'SLAUGHTER MATURE',
  'SLAUGHTER: UDDER',
  'SLAUGHTER: LEGS',
  'SLAUGHTER: FOOTROT',
  'SLAUGHTER: FERTILITY',
  'SLAUGHTER: GUST',
  'SLAUGHTER: DENTAL',
  'OTHER'
];
