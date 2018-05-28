import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'orderBy'
})

export class LivestockOrderBy implements PipeTransform {
  transform(obj: any, orderFields: any): any {
    orderFields.forEach(function (currentField) {
      let orderType = 'ASC';

      if (currentField[0] === '-') {
        currentField = currentField.substring(1);
        orderType = 'DESC';
      }

      obj.sort(function (a, b) {
        if (orderType === 'ASC') {
          if (a[currentField] < b[currentField]) { return -1; }
          if (a[currentField] > b[currentField]) { return 1; }
          return 0;
        } else {
          if (a[currentField] < b[currentField]) { return 1; }
          if (a[currentField] > b[currentField]) { return -1; }
          return 0;
        }
      });

    });
    return obj;
  }
}
