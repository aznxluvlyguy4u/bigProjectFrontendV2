import {Animal} from '../../shared/models/animal.model';

export class Birth {
  public date_of_birth: string;
  public is_aborted: boolean;
  public is_pseudo_pregnancy: boolean;
  public mother: Animal = new Animal();
  public father: Animal = new Animal();
  public children: Animal[] = [];
}


export class ParentByUln {
  public uln_country_code: string;
  public uln_number: string;
}

export class SurrogateMotherByUln extends ParentByUln {
}

export class Child {
  public uln_country_code: string;
  public uln_number: string;
  public is_alive: boolean;
  public nurture_type: string;
  public gender: string;
  public birth_progress: string;
  public birth_weight: number;
  public tail_length: number;
  public surrogate_mother: any;
  public date_of_birth: string;
  public date_scanned: string;
  public has_lambar: boolean;
  public surrogateMotherMissingUlnCountryCode = false;
  public surrogateMotherUlnCountryCodeOnlyHasChanged = false;
  public surrogateMotherHasChanged = false;
}


export class StillBorn {
  public is_alive: boolean;
  public gender: string;
  public birth_progress: string;
  public birth_weight: number;
  public tail_length: number;
}


export class BirthRequest {
  public mother: any;
  public father: any;
  public children: Array<Child | StillBorn>;
  public stillBorns: Array<StillBorn>;
  public date_of_birth: string;
  public is_aborted: boolean;
  public is_pseudo_pregnancy: boolean;
  public litter_size: number;
  public stillborn_count: number;
  public born_alive_count: number;
  public declareStatus: boolean;
  public isSubmitting: boolean;
  public errorMessage: string;
  public suggestedCandidateFathersIsLoading: boolean;
  public suggestedCandidateMothersIsLoading: boolean;
  constructor() {
    this.declareStatus = null;
  }
}


export class Litter {
  public litter_id: string;
  public log_date: string;
  public date_of_birth: string;
  public mother_uln_country_code: string;
  public mother_uln_number: string;
  public father_uln_country_code: string;
  public father_uln_number: string;
  public stillborn_count: string;
  public born_alive_count: string;
  public is_abortion: string;
  public is_pseudo_pregnancy: string;
  public status: string;
  public request_state: string;
  public message_number: string;
  public isRevokeButtonClicked = false;
  public mother_collar_color: string;
  public mother_collar_number: string;
  public father_collar_color: string;
  public father_collar_number: string;
}

export class BirthErrorResponse extends Animal {
  public request_id: string;
  public message_number: string;
  public log_date: string;
  public error_code: string;
  public error_message: string;
  public request_state: string;
  public date_of_birth: string;
  public stillborn_count: number;
  public children: Animal[] = [];
  public is_pseudo_pregnancy: boolean;
  public is_abortion: boolean;
  public father_uln_country_code: string;
  public father_uln_number: string;
  public mother_uln_country_code: string;
  public mother_uln_number: string;
}

export class LitterDetails {
  public log_date: string;
  public date_of_birth: string;
  public mother_uln_country_code: string;
  public mother_uln_number: string;
  public father_uln_country_code: string;
  public father_uln_number: string;
  public stillborn_count: string;
  public born_alive_count: string;
  public is_abortion: string;
  public is_pseudo_pregnancy: string;
  public status: string;
  public request_state: string;
  public children: Animal[] = [];
}

export const BIRTH_PROGRESS_TYPES = [
  'NO HELP',
  'LIGHT WITH HELP',
  'NORMAL WITH HELP',
  'HEAVY WITH HELP',
  'CAESARIAN (LAMB TOO BIG)',
  'CAESARIAN (INSUFFICIENT ACCESS)'
];

export const LAMBAR_SURROGATE_OPTIONS = [
  'NONE',
  'LAMBAR',
  'SURROGATE'
];

export class CandidateFathersRequest {
  public date_of_birth: string;
}

export class CandidateMothersRequest {
  public date_of_birth: string;
}

export class CandidateSurrogatesRequest {
  public date_of_birth: string;
}
