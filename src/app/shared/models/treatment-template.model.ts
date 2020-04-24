import {TreatmentLocation} from './treatment-location.model';
import {MedicationOption} from './medication-option.model';

export class TreatmentTemplate {
  id: number;
  dutchType: string;
  location: TreatmentLocation;
  description: string;
  medications: MedicationOption[];
  is_active: boolean;
  type: string;
}
