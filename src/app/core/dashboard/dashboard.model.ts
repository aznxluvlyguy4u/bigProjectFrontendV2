export class DashboardInfo {
  public introduction: string;
  public ubn: string;
  public health_status: HealthStatus = new HealthStatus;
  public livestock: AnimalCategory = new AnimalCategory;
  public arrival: ArrivalInfo = new ArrivalInfo;
  public depart: DepartInfo = new DepartInfo;
  public mate: MateInfo = new MateInfo;
  public birth: BirthInfo = new BirthInfo;
  public loss: LossInfo = new LossInfo;
  public tag_transfer: EartagsInfo = new EartagsInfo;
}

class AnimalCategory {
  public pedigree_animals: CategoryStats = new CategoryStats;
  public non_pedigree_animals: CategoryStats = new CategoryStats;
  public all_animals: CategoryStats = new CategoryStats;
}

class HealthStatus {
  public location_health_status: '';
  public maedi_visna_status: '';
  public maedi_visna_check_date: '';
  public maedi_visna_end_date: '';
  public scrapie_status: '';
  public scrapie_check_date: '';
  public scrapie_end_date: '';
}

class CategoryStats {
  public total: number;
  public adults: number;
  public lambs: number;
}

class ArrivalInfo {
  public date_last_declaration: string;
  public error_count: number;
}

class DepartInfo {
  public date_last_declaration: string;
  public error_count: number;
}

class MateInfo {
  public date_last_declaration: string;
  public error_count: number;
}

class BirthInfo {
  public date_last_declaration: string;
  public error_count: number;
}

class LossInfo {
  public date_last_declaration: string;
  public error_count: number;
}

class EartagsInfo {
  public date_last_declaration: string;
  public unassigned_tags: number;
  public used_tags: number;
}
