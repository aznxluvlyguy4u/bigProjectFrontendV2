import {StringFormatter} from './string-formatter.service';
import {NumberValidator} from '../../validation/number.validation';

export class AlgorithmService {

  public static isValidSevenTestNumber(input: any): boolean {
    let number = input + '';

    const minLength = 1;
    const maxLength = 7;

    if (!NumberValidator.isNumber(number)) {
      return false;
    }

    if (number.length < minLength || number.length > maxLength) {
      return false;
    }

    if (number.length < maxLength) {
      number = StringFormatter.padStart(number, maxLength, '0');
    }

    if (number.length === maxLength) {
      const chars = number.split('');
      const calc_values = [1, 7, 3, 1, 7, 3, 1];
      let sum = 0;

      for (let i = 0; i < chars.length; i++) {
        sum = sum + (parseInt(chars[i], null) * calc_values[i]);
      }
      return sum % 10 === 0;
    }

    return false;
  }

}
