import {Pipe, PipeTransform} from '@angular/core';
import {UtilsService} from '../services/utils/utils.services';

@Pipe({
  name: 'lastFiveMessagesFilter'
})

export class lastFiveMessagesFilterPipe implements PipeTransform {
  constructor(private utils: UtilsService) {
  }

  transform(list: any, args: string[]): any {
    let filtered = list;

    if (list.length > 0) {
      filtered = filtered.filter(
        message => {
          return message.is_read === false;
        }
      );
    }

    return filtered.slice(0, 5);
  }

}
