import {User} from './person.model';

export class EarTag {
  public animal_order_number: string;
  public order_date: string;
  public tag_status: string;
  public uln: string;
  public ulnLastFive: string;
  public uln_country_code: string;
  public uln_number: string;
}

export class RetrieveAnimals {
  public id: number;
  public log_date: string;
  public request_id: string;
  public message_id: string;
  public request_state: string;
  public relation_number_keeper: string;
  public ubn: string;
  public location: Location;
  public animal_type: number;
  public action_by: User;
  public is_rvo_leading: boolean;
  public current_animals_count: string;
  public retrieved_animals_count: string;
  public new_animals_count: string;
  public blocked_new_animals_count: string;
  public removed_animals_count: string;
}
