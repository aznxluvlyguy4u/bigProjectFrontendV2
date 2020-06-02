import {TreatmentMedication} from './treatment-medication.model';

export class MedicationOption {
  dosage: number;
  dosage_unit: string;
  treatment_duration: string;
  reg_nl: string;
  treatment_medication: TreatmentMedication;
}
