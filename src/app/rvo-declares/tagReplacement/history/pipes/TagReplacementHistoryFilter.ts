import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'tagReplacementHistoryFilter'
})

export class TagReplacementHistoryFilterPipe implements PipeTransform {

  transform(value: any, args: string[]): any {
    let search_query = args[0];
    let filtered = value;

    // Filter: Search Field
    if (search_query !== null) {
      search_query = args[0].toLocaleUpperCase();
      filtered = filtered.filter(tagReplacement => (
        tagReplacement.log_date +
        tagReplacement.animal.uln +
        tagReplacement.animal.uln_country_code +
        tagReplacement.animal.uln_number +
        tagReplacement.animal.work_number +
        tagReplacement.tag.uln +
        tagReplacement.tag.uln_country_code +
        tagReplacement.tag.uln_number +
        tagReplacement.tag.work_number +
        tagReplacement.status
      ).indexOf(search_query) !== -1);
    }

    return filtered;
  }
}

