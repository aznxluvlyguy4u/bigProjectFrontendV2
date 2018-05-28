import {ContactPerson, User} from './person.model';
import {Veterinarian} from './veterinarian.model';
import {Invoice} from './invoice.model';
import {LocalLocation} from './location.model';
import {Address} from './address.model';

export class Company {
  public id: number;
  public company_id: string;
  public company_name: string;
  public ubn: string;
  public contact_person: ContactPerson = new ContactPerson();
  public veterinarian: Veterinarian = new Veterinarian();
  public address: Address = new Address();
  public billing_address: Address = new Address();
  public telephone_number: string;
  public vat_number: string;
  public chamber_of_commerce_number: string;
  public company_relation_number: string;
  public is_reveal_historic_animals: boolean;
  public locations: LocalLocation[] = [];
  public debtor_number: string;
  public owner: User;
  public company_address: Address;
  public invoices: Invoice[] = [];
}
