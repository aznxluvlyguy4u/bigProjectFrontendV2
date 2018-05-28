import {Animal} from '../../shared/models/animal.model';

class Tag {
  public uln_country_code: string;
  public uln_number: string;
  public uln: string;
  public work_number: string;
}

export class TagReplacement {
  public tag: Tag = new Tag;
  public animal: Animal = new Animal;
}

export class TagReplacementHistoryChangeResponse extends TagReplacement {
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
}

export class TagReplacementErrorResponse extends TagReplacement {
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
