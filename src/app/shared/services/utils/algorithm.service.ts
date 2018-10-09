import {StringFormatter} from './string-formatter.service';

export class AlgorithmService {

  public static isValidSevenTestNumber(input: any): boolean {
    let number = input + '';

    if (number.length === 0 || number.length > 7) {
      return false;
    }

    if (number.length < 7) {
      number = StringFormatter.padStart(number, 7, '0');
    }

    if (number.length === 7) {
      const chars = number.split('');
      const calc_values = [1, 7, 3, 1, 7, 3, 1];
      let sum = 0;

      for (let i = 0; i < chars.length; i++) {
        sum = sum + (parseInt(chars[i], null) * calc_values[i]);
      }

      if ((sum / 10) % 1 === 0) {
        return false;
      }
    }

    return true;
  }

}
