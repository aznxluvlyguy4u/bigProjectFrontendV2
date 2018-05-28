import {Animal} from './animal.model';
import {Weight} from './measurement.model';
import {LocalLocation} from './location.model';

abstract class DeclareNsfoBase {
  request_id: string;
  message_id: string;
  log_date: string;
  request_state: string;
  revoke_date: string;
  request_state: string;
  is_hidden: boolean;
  is_overwritten: boolean;
  relation_number_keeper: string;
  ubn: string;
}

export class Mate extends DeclareNsfoBase {
  public ram: Animal = new Animal();
  public ewe: Animal = new Animal();
  public start_date: string;
  public end_date: string;
  public ki: string | boolean;
  public pmsg: string | boolean;
  public ram_uln_country_code: string;
  public ram_uln_number: string;
}

export class MateChangeResponse extends Mate {
}

export class DeclareWeight extends DeclareNsfoBase {
  animal: Animal = new Animal();
  measurement_date: string;
  weight: number;
  is_birth_weight: boolean;
  previous_versions: DeclareWeight[] = [];
  current_version: DeclareWeight;
  location: LocalLocation;
  weight_measurement: Weight;
}

export class WeightChangeResponse extends DeclareWeight {
}
