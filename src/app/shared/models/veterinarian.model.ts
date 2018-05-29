import {ContactPerson} from './person.model';
import {Address} from './address.model';

export class Veterinarian {
  public dap_number: string;
  public company_name: string;
  public contact_person: ContactPerson = new ContactPerson();
  public address: Address = new Address();
  public telephone_number: string;
  public email_address: string;
}
