import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'departHistoryFilter'
})
export class DepartHistoryFilterPipe implements PipeTransform {

  transform(value: any, args: string[]): any {
    let search_query = args[0];
    let filtered = value;

    // Filter: Search Field
    if (search_query !== null) {
      search_query = args[0].toLocaleUpperCase();
      filtered = filtered.filter(depart => (
        depart.log_date +
        depart.uln +
        depart.work_number +
        depart.pedigree +
        depart.depart_date +
        depart.reason_of_depart +
        depart.ubn_new_owner +
        depart.certificate_number +
        depart.status
      ).indexOf(search_query) !== -1);
    }

    return filtered;
  }
}

