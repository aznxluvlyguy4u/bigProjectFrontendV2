import {Injectable} from '@angular/core';

@Injectable()
export class ArrayUtilService {
  private static hasNonNullValues(values: []): boolean {
    for (const value of values) {
      if (value !== undefined && value !== null) {
        return true;
      }
    }
    return false;
  }
}
