import {QUERY_PARAM_FILE_TYPE} from '../../variables/query-param.constant';
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
}
