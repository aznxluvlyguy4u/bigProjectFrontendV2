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

      let haystack =
        litter.mother_uln_country_code + litter.mother_uln_number +
        litter.father_uln_country_code + litter.father_uln_number
      ;

      return haystack.toLowerCase().indexOf(needle) !== -1;
    });
  }
}
