import {TreatmentLocation} from './treatment-location.model';
import {MedicationOption} from './medication-option.model';
import {Animal} from './animal.model';
import {TreatmentMedication} from './treatment-medication.model';

export class TreatmentTemplate {
  id: number;
  create_date: string;
  dutchType: string;
  location: TreatmentLocation;
  description: string;
  treatment_medications: TreatmentMedication[];
  is_active: boolean;
  type: string;
  start_date: string;
  end_date: string;
  status: string;
  revoke_date: string;
  animals: Animal[];
  is_editable: boolean;
  allow_end_date: boolean;
  templatetype: string;
  q_fever_type: string|undefined;
  is_new: boolean;
}


export class TreatmentTemplateSelectionGroup {
  name: string;
  templates: TreatmentTemplate[];

  constructor(name: string, templates: TreatmentTemplate[]) {
    this.name = name;
    this.templates = templates;
  }
}
