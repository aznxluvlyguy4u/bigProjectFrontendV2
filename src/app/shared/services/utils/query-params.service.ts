import {QUERY_PARAM_FILE_TYPE} from '../../variables/query-param.constant';
import {QueryParamSetModel} from '../../models/query-param-set.model';
import {Injectable} from '@angular/core';

@Injectable()
export class QueryParamsService {

  public static getFileTypeQueryParam(filetype: string, isFirstQueryParam: boolean = true) {
    return this.getQueryParamStringValue(filetype, QUERY_PARAM_FILE_TYPE, isFirstQueryParam);
  }

  public static getQueryParamStringValue(value: string, queryParam: string, isFirstQueryParam: boolean = true): string {
    const prefix = isFirstQueryParam ? '?' : '&';
    return typeof value === 'string' ? prefix + queryParam + '=' + value.toLowerCase() : '';
  }
  
  
  public static getQueryParamsAsString(sets: QueryParamSetModel[]): string {
    let result = '';
    if (!QueryParamsService.hasNonNullQueryParams(sets)) {
      return result;
    }

    let isFirstQueryParam = true;

    for (let set of sets) {
      let value = set.value;
      console.log(set, value)
      if (value !== undefined && value !== null){
        const prefix = isFirstQueryParam ? '?' : '&';
        isFirstQueryParam = false;

        const formattedValue = typeof value === 'string' ? value.toLowerCase() : value;
        result = result + prefix + set.key + '=' + formattedValue;
        console.log(result);
      }
    }

    return result;
  }

  public static hasNonNullQueryParams(sets: QueryParamSetModel[]): boolean {
    for (let set of sets) {
      let value = set.value;
      console.log(set, value);
      if (value !== undefined && value !== null){
        return true;
      }
    }
    return false;
  }
}
