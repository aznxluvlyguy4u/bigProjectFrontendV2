export class ReportRequest {
  public id: number;
  started_at: string;
  finished_at: string;
  report_worker: ReportWorker;
  worker_type: number;
  public error_code: number;
  public error_message: string;
}

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
}

export class ReportWorker {
  id: number;
  download_url: string;
  hash: string;
  report_type: ReportType;
  file_type: string;
}
