import {Pipe, PipeTransform} from '@angular/core';
import {LossChangeResponse} from '../../loss.model';
import {Litter} from '../../../birth/birth.model';

@Pipe({
  name: 'lossHistoryFilter'
})

export class LossHistoryFilterPipe implements PipeTransform {

  transform(value: any, search_query: string): any {

      // Filter: Search Field
      if (!search_query || search_query === '') {
        return value;
      }

      return value.filter((loss: LossChangeResponse) => {
        const needle = search_query.toLowerCase();

        const haystack =
          loss.log_date +
          loss.uln +
          loss.work_number +
          loss.pedigree +
          loss.date_of_death +
          loss.reason_of_loss +
          loss.status +
          loss.collar_color + ' ' + loss.collar_number +
          loss.collar_color + loss.collar_number;

        return haystack.toLowerCase().indexOf(needle) !== -1;
      });
    }
}

