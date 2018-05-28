import {Pedigree} from './pedigree.model';


export class User {
  public person_id: string;
  public prefix: string;
  public first_name_letter: string;
  public first_name: string;
  public last_name: string;
  public email: string;
  public email_address: string;
  public pedigrees: Pedigree[] = [];
  public access_level: string;
}

export class ContactPerson extends User {
  public cellphone_number: string;
  public telephone_number: string;
}

export class Inspector extends User {
}
