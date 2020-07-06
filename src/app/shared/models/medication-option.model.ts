import {TreatmentMedication} from './treatment-medication.model';

export class MedicationOption {
  name: string;
  dosage: number;
  dosage_unit: string;
  treatment_duration: string;
  waiting_days: number;
  waiting_time_end: string;
  reg_nl: string;
  treatment_medication: TreatmentMedication;
}
