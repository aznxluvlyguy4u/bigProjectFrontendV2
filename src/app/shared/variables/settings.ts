import {Injectable} from '@angular/core';

@Injectable()
export class Settings {
  public VIEW_DATE_FORMAT = 'DD-MM-YYYY';
  public VIEW_DATETIME_FORMAT = 'DD-MM-YYYY HH:mm';
  public MODEL_DATETIME_FORMAT = 'YYYY-MM-DDThh:mm:ssZ';
  public MODEL_DATE_FORMAT = 'YYYY-MM-DD';
  public DEFAULT_LANGUAGE = 'nl-NL';
  public USE_LANGUAGE = 'nl-NL';
}
