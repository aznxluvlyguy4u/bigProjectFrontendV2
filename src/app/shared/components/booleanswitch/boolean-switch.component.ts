import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';


@Component({
  selector: 'app-boolean-switch',
  templateUrl: './boolean-switch.component.html',
})
export class BooleanSwitchComponent {
  @Input() allowNull = false;
  @Input() boolVal: boolean;
  @Input() disabled = false;

  @Output() boolValChanged = new EventEmitter<boolean>();

  isEmpty() {
    return this.boolVal === null || this.boolVal === undefined;
  }

  toggle() {
    switch (this.boolVal) {
      case true:
        this.boolVal = false;
        break;

      case false:
        this.boolVal = this.allowNull ? null : true;
        break;

      default:
        this.boolVal = true;
        break;
    }

    this.boolValChanged.emit(this.boolVal);
  }
}
