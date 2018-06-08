import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'eartagFilter'
})

export class EartagFilterPipe implements PipeTransform {

  transform(value: any, args: string[]): any {
    let search_query = args[0];
    let filtered = value;

    // Filter: Search Field
    if (!!search_query) {
      search_query = args[0].toLocaleUpperCase();
      filtered = filtered.filter(eartag => (
        eartag.uln +
        eartag.ulnLastFive
      ).indexOf(search_query) !== -1);
    }

    return filtered;
  }
}
