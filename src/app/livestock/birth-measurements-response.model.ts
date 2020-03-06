import {TailLength} from '../shared/models/tail-length.model';
import {WeightMeasurement} from '../shared/models/WeightMeasurement';

export class BirthMeasurementsResponse {
  public tail_length: TailLength;
  public birth_weight: WeightMeasurement;
  public birth_progress: string;
}
