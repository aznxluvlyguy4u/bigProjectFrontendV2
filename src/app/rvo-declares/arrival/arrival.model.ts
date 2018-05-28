import {HistoryResponseModel} from '../../shared/components/historyerrorinfo/history-response.model';
import {Animal} from '../../shared/models/animal.model';

class Arrival {
  public arrival_date: string;
  public is_import_animal: boolean;
  public ubn_previous_owner: string;
  public country_origin: string;
  public certificate_number: string;
  public animal: Animal = new Animal();
}

export class ArrivalRequest extends Arrival {
}

export class ArrivalChangeResponse extends Arrival implements HistoryResponseModel {
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
  public request_state: string;
  error_code: string;
  error_message: string;
}

export class ArrivalErrorResponse extends Arrival {
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
  public request_state: string;
  public is_removed_by_user: boolean;
}
