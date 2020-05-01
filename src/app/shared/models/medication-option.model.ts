import {TreatmentMedication} from './treatment-medication.model';

export class MedicationOption {
  dosage: number;
  dosage_unit: string;
  waiting_days: number;
  reg_nl: string;
  treatment_medication: TreatmentMedication;
}
