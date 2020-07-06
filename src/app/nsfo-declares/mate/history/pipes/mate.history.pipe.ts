import {Pipe, PipeTransform} from '@angular/core';
import {MateChangeResponse} from '../../../../shared/models/nsfo-declare.model';

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

      const haystack =
        mate.ewe.uln_country_code + mate.ewe.uln_number +
        mate.ram.uln_country_code + mate.ram.uln_number +
        mate.ewe.collar_color + mate.ewe.collar_number +
        mate.ewe.collar_color + ' ' + mate.ewe.collar_number +
        mate.ram.collar_color + mate.ram.collar_number +
        mate.ram.collar_color + ' ' + mate.ram.collar_number
      ;

      return haystack.toLowerCase().indexOf(needle) !== -1;
    });
  }
}

