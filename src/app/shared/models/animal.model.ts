import {Litter} from './litter.model';
import {Exterior, MeasurementOutput, Weight} from './measurement.model';
import {Breeder} from './breeder.model';
import {Mate} from './nsfo-declare.model';
import {BreedValues} from './breedvalues.model';

export class Animal {
  public id: string;
  public uln_country_code: string;
  public uln_number: string;
  public uln: string;
  public pedigree_country_code: string;
  public pedigree_number: string;
  public stn: string;
  public work_number: string;
  public worker_number: string;
  public collar: Collar = new Collar();
  public collar_color: number;
  public collar_number: number;
  public name: string;
  public nickname: string;
  public date_of_birth: string;
  public dd_mm_yyyy_date_of_birth: string;
  public birth_progress: string;
  public litter_size: string;
  public n_ling: number;
  public inbreeding_index: string;
  public gender: string;
  public rearing: string;
  public suction_size: string;
  public blind_factor: string;
  public scrapie_genotype: string;
  public breed_status: string;
  public predicate: string;
  public breed: string;
  public inflow_date: string;
  public nurture_type: string;
  public is_alive: boolean;
  public date_of_death: string;
  public cause_of_death: string;
  public birth_weight: string;
  public last_weight: string;
  public tail_length: string;
  public mates: Mate[] = [];
  public note: string;
  public litter: Litter = new Litter();
  public surrogate_mother: any;
  public mother: string;
  public father: string;
  public parent_mother: Ewe;
  public parent_father: Ram;
  public exteriors: Exterior[] = [];
  public exterior: Exterior = new Exterior();
  public breeder: Breeder = new Breeder();
  public measurement: MeasurementOutput = new MeasurementOutput();
  public declare_log: any[];
  public is_public: boolean;
  public is_user_allowed_to_access_animal_details: boolean;
  public ubn: string;
  public breed_code: string;
  public last_mate: Mate;
  public is_stillborn: boolean;
  public weights: Weight[] = [];
  public weight: any;
  public new_weight: any;
  public sending: boolean;
  public successful: boolean;
  public selected: boolean;
  public breed_values: BreedValues[] = [];
  public pedigree: string;
  public is_own_historic_animal: boolean;
  public is_own_animal: boolean;
  public production: string;
  public general_appearance: number;
  public child_count: number;
}

export class Ewe extends Animal {
}

export class Ram extends Animal {
}

export class Collar {
  color: string;
  number: string;
}

export class LivestockAnimal extends Animal {
  public selected: boolean;
  public added: boolean;
  public ulnLastFive: string;
  public current_weight: string;
  date_of_birth_sort: string;
  public filtered: any;
  public suggested: any;
}

export const LIVESTOCK_SORT_OPTIONS = [
  'GENDER', 'DATE OF BIRTH', 'PEDIGREE NUMBER', 'COLLAR NUMBER', 'INFLOW DATE', 'WORK NUMBER'
];

export const LIVESTOCK_GENDER_FILTER_OPTIONS = [
  'ALL', 'MALE', 'FEMALE', 'NEUTER'
];
