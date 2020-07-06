import {Address} from './address.model';
import {Company} from './company.model';

export class LocalLocation {
  public id: number;
  public location_id: number;
  public ubn: string;
  public company: Company;
  public address: Address = new Address();
  public is_active: boolean;
}
