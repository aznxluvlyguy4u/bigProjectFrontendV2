import * as _ from 'lodash';
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'livesearchFilter'
})

export class LivesearchFilterPipe implements PipeTransform {

  transform(value: any, args: string[]): any {
    let search_query = args[0];
    let filtered = value;

    // Filter: Search Field
    if (!!search_query) {
      search_query = args[0].toLocaleUpperCase();
      filtered = filtered.filter(animal => (
        animal.uln +
        animal.ulnLastFive
      ).indexOf(search_query) !== -1);
    }

    if (filtered.length === 0) {
      filtered = value;
    }

    filtered = _.orderBy(filtered, ['ulnLastFive'], ['asc']);

    return filtered;
  }
}
