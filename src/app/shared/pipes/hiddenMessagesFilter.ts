import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'hiddenMessagesFilter'
})

export class HiddenMessagesFilterPipe implements PipeTransform {

  transform(list: any, args: any[]): any {

    const showHiddenMessages: boolean = args[0];
    let filtered = list;

    if (!showHiddenMessages && list.length > 0) {
      filtered = filtered.filter(
        errorMessage => {
          return errorMessage.is_removed_by_user === showHiddenMessages;
        }
      );
    }

    return filtered;
  }

}
