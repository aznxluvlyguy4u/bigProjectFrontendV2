import { Country } from './country.model';

export class Address {
  public street_name: string;
  public address_number: string;
  public address_number_suffix: string;
  public suffix: string;
  public postal_code: string;
  public city: string;
  public state: string;
  public country: Country;
}
