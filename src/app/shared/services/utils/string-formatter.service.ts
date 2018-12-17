export class StringFormatter {

  static padStart(string: string, padLength: number, padChar: string = '0'): string {
    if (string.length >= padLength) {
      return string;
    }

    const pad = new Array(1 + padLength).join(padChar);
    return (pad + string).slice(-pad.length);
  }

  static firstChar(string: string|number): string {
    string = string + ''; // convert number to string
    return string.charAt(0);
  }
}
