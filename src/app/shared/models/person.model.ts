import {Pedigree} from './pedigree.model';


export class User {
  public person_id: string;
  public prefix: string;
  public full_name: string;
  public first_name_letter: string;
  public first_name: string;
  public last_name: string;
  public email: string;
  public email_address: string;
  public pedigrees: Pedigree[] = [];
  public access_level: string;
  public health_subscription: boolean;
  public public_live_stock: boolean;
  public is_active: boolean;
  public type: string;
}

export class ContactPerson extends User {
  public cellphone_number: string;
  public telephone_number: string;
}

export class Inspector extends User {
}
