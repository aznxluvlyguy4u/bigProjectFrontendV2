import {Pipe, PipeTransform} from '@angular/core';
import {MateChangeResponse} from '../../mate.model';

@Pipe({
  name: 'mateHistoryFilter'
})
export class MateHistoryPipe implements PipeTransform {

  transform(value: any, term: string) {
    if (!term || term === '') {
      return value;
    }

    return value.filter((mate: MateChangeResponse) => {
      const needle = term.toLowerCase();

      let haystack =
        mate.ewe.uln_country_code + mate.ewe.uln_number +
        mate.ram.uln_country_code + mate.ram.uln_number
      ;

      return haystack.toLowerCase().indexOf(needle) !== -1;
    });
  }
}

