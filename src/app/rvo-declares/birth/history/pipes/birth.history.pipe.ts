import {Pipe, PipeTransform} from '@angular/core';
import {Litter} from '../../birth.model';

@Pipe({
  name: 'birthHistoryFilter'
})
export class BirthHistoryPipe implements PipeTransform {

  transform(value: any, term: string) {
    if (!term || term === '') {
      return value;
    }

    return value.filter((litter: Litter) => {
      const needle = term.toLowerCase();

      const haystack =
        litter.mother_uln_country_code + litter.mother_uln_number +
        litter.father_uln_country_code + litter.father_uln_number +
        litter.mother_collar_color + litter.mother_collar_number +
        litter.mother_collar_color + ' ' + litter.mother_collar_number +
        litter.father_collar_color + litter.father_collar_number +
        litter.father_collar_color + ' ' + litter.father_collar_number
      ;

      return haystack.toLowerCase().indexOf(needle) !== -1;
    });
  }
}
