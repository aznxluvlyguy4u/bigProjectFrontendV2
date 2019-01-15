abstract class Worker {
  public id: number;
  started_at: string;
  finished_at: string;
  worker_type: number;
  public error_code: number;
  public error_message: string;
}

export class ReportRequest extends Worker {
  download_url: string;
  hash: string;
  report_type: ReportType;
  file_type: string;
}

/**
 * Note that these enum values should match the ReportType enum class in the api
 *
 * When including extra report types,
 * also update the logic in ReportModalComponent.getReportTypeString()
 * and the translation files
 */
export enum ReportType {
  ANNUAL_ACTIVE_LIVE_STOCK = 1,
  ANNUAL_TE_100 = 2,
  FERTILIZER_ACCOUNTING = 3,
  INBREEDING_COEFFICIENT = 4,
  PEDIGREE_CERTIFICATE = 5,
  ANIMALS_OVERVIEW = 6,
  ANNUAL_ACTIVE_LIVE_STOCK_RAM_MATES = 7,
  OFF_SPRING = 8,
  PEDIGREE_REGISTER_OVERVIEW = 9,
  LIVE_STOCK = 10,
  BIRTH_LIST = 11,
  MEMBERS_AND_USERS_OVERVIEW = 12,
  ANIMAL_HEALTH_STATUSES = 13,
  QUICK_VIEW_KPIS = 14,
  COMPANY_REGISTER = 15,
  MARKS_PER_ANIMAL_PER_BIRTH_YEAR = 16,
  CLIENT_NOTES_OVERVIEW = 17,
  STAR_EWES = 18,
  COMBI_FORMS_VKI_AND_TRANSPORT_DOCUMENTS = 19,
  EWE_CARD = 20,
  BLOOD_AND_TISSUE_INVESTIGATIONS = 21,
  I_AND_R = 22,
  POPREP_INPUT_FILE = 23,
  REASONS_DEPART_AND_LOSS = 24,
  WEIGHTS_PER_BIRTH_YEAR = 25,
  TREATMENTS = 26,
  MODEL_EXPORT_CERTIFICATE = 27,
  ACTION_LOG = 28
}

export class ReportWorker {
  id: number;
  download_url: string;
  hash: string;
  report_type: ReportType;
  file_type: string;
}
