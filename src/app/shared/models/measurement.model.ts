import {Animal} from './animal.model';
import {Inspector} from './person.model';

// Used only in animal details output
export class MeasurementOutput {
  public measurement_date: string;
  public fat_cover_one: number;
  public fat_cover_two: number;
  public fat_cover_three: number;
  public muscular_thickness: string;
  public birth_weight: string;
  public birth_progress: string;
  public scan_weight: string;
  public tail_length: string;
}

abstract class MeasurementBase {
  public measurement_date: string;
  public inspector: Inspector = new Inspector();
}

export class Exterior extends MeasurementBase {
  public kind: string;
  public skull: string;
  public progress: string;
  public muscularity: string;
  public proportion: string;
  public exterior_type: string;
  public leg_work: string;
  public fur: string;
  public general_appearance: string;
  public height: string;        // May contain values below 69
  public breast_depth: string;  // May contain values below 69
  public torso_length: string;  // May contain values below 69
  public markings: string;
}

export class ExteriorKind {
  code: string;
}

export class Weight extends MeasurementBase {
  public weight: string;
}
