import {Address} from './address.model';

export class InvoiceSenderDetails {
  public id: number;
  public name: string;
  public address: Address;
  public chamber_of_commerce_number: string;
  public vat_number: string;
  public iban: string;
  public payment_deadline_in_days: number;
  public is_deleted: boolean;
}
