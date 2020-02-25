import {Inspector} from './person.model';

// Used only in animal details output
export class MeasurementOutput {
  public measurement_date: string;
  public scan_weight: string;
  public fat_cover_one: number;
  public fat_cover_two: number;
  public fat_cover_three: number;
  public muscular_thickness: string;
}

export class BirthOutput {
  public birth_weight: string;
  public birth_progress: string;
  public tail_length: string;
}

abstract class MeasurementBase {
  public measurement_date: string;
  public inspector: Inspector = new Inspector();
}

export class Exterior extends MeasurementBase {
  public kind: string;
  public skull: number;
  public progress: number;
  public muscularity: number;
  public proportion: number;
  public exterior_type: number;
  public leg_work: number;
  public fur: number;
  public general_appearance: number;
  public height: number;        // May contain values below 69
  public breast_depth: number;  // May contain values below 69
  public torso_length: number;  // May contain values below 69
  public markings: number;
}

export class ExteriorKind {
  code: string;
}

export class Weight extends MeasurementBase {
  public weight: string;
}
