import * as moment from 'moment';
import {Pipe, PipeTransform} from '@angular/core';
import {SettingsService} from '../../../services/settings/settings.service';
import {TranslateService} from '@ngx-translate/core';

@Pipe({
  name: 'livestockFilter'
})

export class LivestockFilterPipe implements PipeTransform {

  private view_date_format;

  constructor(settings: SettingsService, private translate: TranslateService) {
    this.view_date_format = settings.getViewDateFormat();
  }

  transform(value: any, args: string[]): any {
    let search_query = args[0];
    const start_date = args[1];
    const end_date = args[2];
    const gender = args[3];
    let breed_code = args[4];
    const production = args[5];

    let filtered = value;

    for (const item of filtered) {
      item.filtered = false;
    }

    // Filter: Search Field
    if (!!search_query) {
      search_query = args[0].toLocaleUpperCase();
      filtered = filtered.filter(animal => (
        animal.uln +
        animal.pedigree +
        animal.date_of_birth +
        animal.gender +
        animal.work_number +
        (animal.collar_color ? this.translate.instant(animal.collar_color) + animal.collar_number : '') +
        (animal.collar_color ? this.translate.instant(animal.collar_color) + ' ' + animal.collar_number : '') +
        animal.collar_color + animal.collar_number +
        animal.collar_color + ' ' + animal.collar_number +
        animal.inflow_date
      ).indexOf(search_query) !== -1);
    }

    // Filter: Date
    if (start_date !== null) {
      if (start_date.length > 0 && (end_date === null || end_date.length === 0)) {
        filtered = filtered.filter(animal => {
          return moment(animal.date_of_birth, this.view_date_format) >= moment(start_date, this.view_date_format);
        });
      }
    }

    if (end_date !== null) {
      if ((start_date === null || start_date.length === 0) && end_date.length > 0) {
        filtered = filtered.filter(animal => {
          return moment(animal.date_of_birth, this.view_date_format) <= moment(end_date, this.view_date_format);
        });
      }
    }

    if (start_date !== null && end_date !== null) {
      if (start_date.length > 0 && end_date.length > 0) {
        filtered = filtered.filter(animal => {
          return (moment(animal.date_of_birth, this.view_date_format) >= moment(start_date, this.view_date_format))
            && (moment(animal.date_of_birth, this.view_date_format) <= moment(end_date, this.view_date_format));
        });
      }
    }

    // Filter: Gender
    if (gender !== 'ALL') {
      filtered = filtered.filter(animal => {
        return animal.gender === gender;
      });
    }

    // Filter: Breed code
    if (breed_code !== '') {
      breed_code = breed_code.toLocaleUpperCase();
      filtered = filtered.filter(animal => {
        if (typeof animal.breed_code !== 'undefined') {
            if (breed_code.length === 1) {
              return animal.breed_code.indexOf(breed_code) === 0;
            } else {
              return animal.breed_code.includes(breed_code);
            }
        } else {
          return false;
        }
      });
    }

    // Filter: production
    if (production !== '') {
      filtered = filtered.filter(animal => {
          if (production === 'yes') {
            return animal.production !== null;
          } else if (production === 'no') {
            return animal.production == null;
          }
      });
    }

    for (const item of filtered) {
      item.filtered = true;
    }

    return filtered;
  }
}
