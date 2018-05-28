import {Pipe, PipeTransform} from '@angular/core';
import {SettingsService} from '../services/settings/settings.service';

@Pipe({
  name: 'localNumberFormat'
})
export class localNumberFormat implements PipeTransform {

  constructor(private settingsService: SettingsService) {
  }

  transform(value: number | string, minimalFractionDigits = 2): string {

    if (value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      value = +value;
    }

    return new Intl.NumberFormat(this.settingsService.getLocale(), {
      minimumFractionDigits: minimalFractionDigits
    }).format(Number(value));
  }
}
