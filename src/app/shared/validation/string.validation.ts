export class StringValidation {
  static isNotEmpty(value?: string): boolean {
    return value != null && value !== '';
  }
}
