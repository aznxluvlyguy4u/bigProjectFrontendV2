import {TreatmentLocation} from './treatment-location.model';
import {MedicationOption} from './medication-option.model';
import {Animal} from './animal.model';

export class TreatmentTemplate {
  id: number;
  create_date: string;
  dutchType: string;
  location: TreatmentLocation;
  description: string;
  medications: MedicationOption[];
  is_active: boolean;
  type: string;
  start_date: string;
  end_date: string;
  animals: Animal[];
}
