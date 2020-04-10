import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'selectorFilter'
})

export class SelectorFilterPipe implements PipeTransform {
  transform(value: any, args: string[]): any {
    let search_query = args[0];
    let type = args[1];
    let filtered = value;

    if (filtered) {
      // Filter: Search Field
      if (type === 'FEMALES') {
        if (!!search_query) {
          search_query = args[0].toLocaleUpperCase();
          filtered = filtered.filter(animal => (
            animal.uln +
            animal.pedigree +
            animal.work_number +
            animal.ulnLastFive +
            animal.collar
          ).indexOf(search_query) !== -1);
        }
        return filtered;
      }

      if (type === 'MALES') {
        if (!!search_query) {
          search_query = args[0].toLocaleUpperCase();
          filtered = filtered.filter(animal => (
            animal.uln +
            animal.pedigree +
            animal.work_number +
            animal.ulnLastFive
          ).indexOf(search_query) !== -1);
        }
        return filtered;
      }

      if (type === 'NONE') {
        if (!!search_query) {
          search_query = args[0].toLocaleUpperCase();
          filtered = filtered.filter(tag => (
            tag.uln +
            tag.ulnLastFive
          ).indexOf(search_query) !== -1);
        }
        return filtered;
      }
    }
  }
}
