import {Animal} from './animal.model';
import {TreatmentMedication} from './treatment-medication.model';

export class Treatment {
  treatment_id: number;
  description: string;
  dutchType: string;
  create_date: string;
  start_date: string;
  end_date: string;
  revoke_date: string;
  status: string;
  type: string;
  animals: Animal[];
  medications: TreatmentMedication[];
  is_editable: boolean;
  has_rvo_details: boolean;
}
