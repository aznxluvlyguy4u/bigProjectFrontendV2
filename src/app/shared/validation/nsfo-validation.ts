import * as moment from 'moment';
import {FormControl, FormGroup} from '@angular/forms';
import {AlgorithmService} from '../services/utils/algorithm.service';
import {StringFormatter} from '../services/utils/string-formatter.service';
import {NumberValidator} from './number.validation';

interface ValidationResult {
  [key: string]: boolean;
}

export class UBNValidator {
  public static minUbnLength = 2;
  public static maxUbnLength = 7;

  static isImportAnimal(group: FormGroup): ValidationResult {
    if (group.controls['import_flag'].value === 'NO') {
      if (group.controls['ubn_previous_owner'].value.trim() !== '') {
        return null;
      }
    }

    if (group.controls['import_flag'].value === 'YES') {
      if (group.controls['ubn_previous_owner'].value.trim() === '') {
        return null;
      }
    }

    return {'isNotImportAnimal': true};
  }

  static isExportAnimal(group: FormGroup): ValidationResult {
    if (group.controls['export_flag'].value === 'NO') {
      if (group.controls['ubn_new_owner'].value.trim() !== '') {
        return null;
      }
    }

    if (group.controls['export_flag'].value === 'YES') {
      // if (group.controls['ubn_new_owner'].value.trim() === '') {
      return null;
      // }
    }
    return {'isNotExportAnimal': true};
  }

  static validateUbnAllowEmpty(control: FormControl): ValidationResult {
    return UBNValidator.validateUbnBase(control, true);
  }

  static validateUbn(control: FormControl): ValidationResult {
    return UBNValidator.validateUbnBase(control, false);
  }

  private static validateUbnBase(control: FormControl, allowEmptyUbn: boolean): ValidationResult {
    let ubn_number = '';

    if (control.value) {
      ubn_number = control.value;
    }

    const isValid =
      (allowEmptyUbn && (ubn_number === '' || ubn_number === null || ubn_number === undefined)) ||
      UBNValidator.isValidNonDutchUbn(ubn_number) ||
      UBNValidator.isValidDutchUbn(ubn_number)
    ;

    return !isValid ? {'validateWithSevenTest': true} : null;
  }

  static isValidNonDutchUbn(ubn: string): boolean {
    return NumberValidator.isNumber(ubn) && this.hasValidUbnLength(ubn) &&
      (
        StringFormatter.firstChar(ubn) === '9' ||
        AlgorithmService.isValidSevenTestNumber(ubn)
      );
  }

  static isValidDutchUbn(ubn: string): boolean {
    return this.hasValidUbnLength(ubn) && AlgorithmService.isValidSevenTestNumber(ubn);
  }

  static hasValidUbnLength(ubn: string): boolean {
    if (!ubn) {
      return false;
    }
    return this.minUbnLength <= ubn.length && ubn.length <= this.maxUbnLength;
  }
}

export class DateValidator {
  static validateDateFormat(control: FormControl): ValidationResult {
    const date = moment(control.value, 'DD-MM-YYYY');
    if (date.isValid()) {
      return null;
    }
    return {'invalidDateFormat': true};
  }

  static validateDateIsNotInTheFuture(control: FormControl): ValidationResult {
    const today = moment().utc();
    const diff = moment(control.value).utc().diff(today, 'minutes');
    if (diff <= 0) {
      return null;
    }
    return {'invalidDateItIsInTheFuture': true};
  }
}

export class LitterValidator {
  static validateLitterSizeNotGreaterThenAlive(group: FormGroup): ValidationResult {
    if (group.controls['litter_size'].value >= group.controls['litter_alive'].value) {
      return null;
    }

    return {'invalidLitterSizeGreaterThenAlive': true};
  }

  static validateLitterSizeNotGreaterThenSeven(group: FormGroup): ValidationResult {
    if (group.controls['litter_size'].value <= 7) {
      return null;
    }

    return {'invalidLitterSizeGreaterThenSeven': true};

  }

  // static validateLitterSizeRequired(group: FormGroup): ValidationResult {
  //      if((group.controls['litter_size'].value === '')
  //      {
  //         return {'invalidLitterSizeRequired':  true};
  //      }

  //      return null
  // }
}

export class TailValidator {
  static TailLengthNotGreaterThen29point9(control: FormControl): ValidationResult {
    if (control.value <= 29.9) {
      return null;
    }

    return {'invalidTailLengthGreaterThen29point9': true};
  }
}

export class WeightValidator {
  static WeightNotGreaterThen9point9(control: FormControl): ValidationResult {
    if (control.value <= 9.9) {
      return null;
    }

    return {'invalidWeightGreaterThen9Point9': true};
  }

  static WeightNotLessThenOr0(control: FormControl): ValidationResult {
    if (control.value > 0 && control.value !== 0) {
      return null;
    }

    return {'invalidWeightNotLessThenOr0': true};
  }
}

export class PasswordValidator {
  static validatePassword(group: FormGroup): ValidationResult {
    if (group.controls['password'].value === group.controls['repeat_password'].value) {
      return null;
    }

    return {'invalidPassword': true};
  }
}


export class ExteriorMeasurementsValidator {
  static validateMeasurementValue(control: FormControl): ValidationResult {
    if ( ExteriorMeasurementsValidator.isEmpty(control.value, false) || (control.value >= 69 && control.value <= 99)) {
      return null;
    }

    return {'invalidExteriorMeasurement': true};
  }

  static validateMeasurementValueBetween0And99(control: FormControl): ValidationResult {
    if ( ExteriorMeasurementsValidator.isEmpty(control.value, false) || (control.value > 0 && control.value <= 99)) {
      return null;
    }

    return {'invalidExteriorMeasurementBetween0And99': true};
  }

  static isEmpty(value: any, allowEmptyString = true): boolean {
    return value === undefined || value === null || value === 0 || (value === '' && allowEmptyString);
  }
}

