export class UlnRequestModel {
  public uln_country_code: string;
  public uln_number: string;

  constructor(uln_country_code: string, uln_number: string) {
    this.uln_country_code = uln_country_code;
    this.uln_number = uln_number;
  }
}
