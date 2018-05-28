import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'lossHistoryFilter'
})

export class LossHistoryFilterPipe implements PipeTransform {

  transform(value: any, args: string[]): any {
    let search_query = args[0];
    let filtered = value;

    // Filter: Search Field
    if (search_query !== null) {
      search_query = args[0].toLocaleUpperCase();
      filtered = filtered.filter(loss => (
        loss.log_date +
        loss.uln +
        loss.work_number +
        loss.pedigree +
        loss.date_of_death +
        loss.reason_of_loss +
        loss.status
      ).indexOf(search_query) !== -1);
    }

    return filtered;
  }
}

