import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'arrivalHistoryFilter'
})

export class ArrivalHistoryFilterPipe implements PipeTransform {

  transform(value: any, args: string[]): any {
    let search_query = args[0];
    let filtered = value;

    // Filter: Search Field
    if (search_query !== null) {
      search_query = args[0].toLocaleUpperCase();
      filtered = filtered.filter(arrival => (
        arrival.log_date +
        arrival.uln +
        arrival.work_number +
        arrival.pedigree +
        arrival.arrival_date +
        arrival.ubn_previous_owner +
        arrival.certificate_number +
        arrival.status
      ).indexOf(search_query) !== -1);
    }

    return filtered;
  }
}
