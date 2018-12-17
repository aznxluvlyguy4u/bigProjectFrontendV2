export class NumberValidator {
  static isNumber(value: string | number): boolean {
    return !isNaN(Number(value.toString()));
  }
}
