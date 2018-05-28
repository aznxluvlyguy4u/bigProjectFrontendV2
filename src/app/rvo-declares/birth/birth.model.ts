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

export class ParentByPedigree {
  public pedigree_country_code: string;
  public pedigree_number: string;
}

export class SurrogateMotherByUln extends ParentByUln {
}

export class SurrogateMotherByPedigree extends ParentByPedigree {
}


// TODO: figure out how to type surrogate_mother as union-types
export class Child {
  public uln_country_code: string;
  public uln_number: string;
  public is_alive: boolean;
  public nurture_type: string;
  public gender: string;
  public birth_progress: string;
  public birth_weight: number;
  public tail_length: number;
  public surrogate_mother: any; // SurrogateMotherByUln | SurrogateMotherByPedigree;
}


export class StillBorn {
  public is_alive: boolean;
  public gender: string;
  public birth_progress: string;
  public birth_weight: number;
  public tail_length: number;
}


// TODO: figure out how to type father and mother as union-types
export class BirthRequest {
  public mother: any;  // ParentByPedigree | ParentByUln;
  public father: any; //  ParentByPedigree | ParentByUln;
  public children: Array<Child | StillBorn>;
  public date_of_birth: string;
  public is_aborted: boolean;
  public is_pseudo_pregnancy: boolean;
  public litter_size: number;
  public stillborn_count: number;
  public born_alive_count: number;
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
}

export class BirthErrorResponse extends Animal {
  public request_id: string;
  public message_number: string;
  public log_date: string;
  public error_code: string;
  public error_message: string;
  public request_state: string;
  public date_of_birth: string;
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
