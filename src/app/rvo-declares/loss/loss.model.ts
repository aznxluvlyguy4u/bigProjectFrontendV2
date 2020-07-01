import {HistoryResponseModel} from '../../shared/components/historyerrorinfo/history-response.model';
import {Animal} from '../../shared/models/animal.model';

class Loss {
  public date_of_death: string;
  public reason_of_loss: string;
  public ubn_processor: string;
  public animal: Animal = new Animal();
  public uln: string;
  public pedigree: string;
  public work_number: string;
}

export class LossRequest extends Loss {
}

export class LossChangeResponse extends Loss implements HistoryResponseModel {
  public request_id: string;
  public message_number: string;
  public log_date: string;
  public uln_country_code: string;
  public uln_number: string;
  public collar_color: string;
  public collar_number: string;
  public pedigree_country_code: string;
  public pedigree_number: string;
  public reason_of_loss: string;
  public request_state: string;
  public status: string;
  error_code: string;
  error_message: string;
}

export class LossErrorResponse extends Loss {
  public request_id: string;
  public message_number: string;
  public log_date: string;
  public uln_country_code: string;
  public uln_number: string;
  public pedigree_country_code: string;
  public pedigree_number: string;
  public reason_of_loss: string;
  public error_code: string;
  public error_message: string;
  public request_state: string;
  public is_removed_by_user: boolean;
}

export const LOSS_REASON_OF_LOSS = [
  'NO REASON',
  'ACUTE DEAD',
  'DISEASE',
  'HEAT CULTIVATE',
  'EUTHANASIA',
  'OTHER',
  'ANIMAL NO LONGER PRESENT'
];
