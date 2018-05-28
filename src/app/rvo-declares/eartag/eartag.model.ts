import {User} from '../../shared/models/person.model';

export class Eartag {
  public uln_country_code: string;
  public uln_number: string;
  public ulnLastFive: string;
  public uln: string;
  public ubn_owner: string;
  public tag_status: string;
}

export class EartagRequest extends Eartag {
  public selected: boolean;
  public ubn_new_owner: string;
}

export class EartagTransfer {
  public ubn_new_owner: string;
  public tags: Array<Eartag>;
}

export class EartagChangeResponse extends Eartag {
  public request_id: string;
  public log_date: string;
  public ubn_new_owner: string;
  public request_state: string;
  public message_number: string;
  action_by: User;
  is_manual: boolean;
  has_force_delete_animals_failed: boolean;
}

export class EartagErrorResponse extends Eartag {
  public request_id: string;
  public log_date: string;
  public ubn_new_owner: string;
  public error_code: string;
  public error_message: string;
  public request_state: string;
}

export class EartagStatusOverviewResponse {
  last_retrieve_tags: EartagChangeResponse;
  births_in_progress: number;
  birth_revokes_in_progress: number;
}
