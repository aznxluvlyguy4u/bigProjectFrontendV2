import {Pipe, PipeTransform} from '@angular/core';
import {MateChangeResponse} from '../../../../shared/models/nsfo-declare.model';
import {TreatmentTemplate} from '../../../../shared/models/treatment-template.model';

@Pipe({
  name: 'treatmentHistoryFilter'
})
export class TreatmentHistoryPipe implements PipeTransform {

  transform(value: any, term: string) {
    if (!term || term === '') {
      return value;
    }

    return value.filter((treatment: TreatmentTemplate) => {
      const needle = term.toLowerCase();

      const haystack =
        treatment.description +
        treatment.dutchType +
        treatment.create_date +
        treatment.start_date +
        treatment.end_date
      ;

      return haystack.toLowerCase().indexOf(needle) !== -1;
    });
  }
}

