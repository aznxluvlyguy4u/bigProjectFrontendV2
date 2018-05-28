import {User} from './person.model';

export class LoginInfo {
  public username: string;
  public password: boolean;
  public new_password: string;
  public logged_in_user: User;
}
