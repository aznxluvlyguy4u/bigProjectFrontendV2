import {TreatmentLocation} from './treatment-location.model';
import {MedicationOption} from './medication-option.model';
import {Animal} from './animal.model';

export class TreatmentTemplate {
  id: number;
  dutchType: string;
  location: TreatmentLocation;
  description: string;
  medications: MedicationOption[];
  is_active: boolean;
  type: string;
  start_date: any;
  end_date: any;
  animals: Animal[];
}
