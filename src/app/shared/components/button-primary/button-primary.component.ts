import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-button-primary',
  templateUrl: './button-primary.component.html',
  styleUrls: ['./button-primary.component.sass']
})
export class ButtonPrimaryComponent {

  @Input() text: string;
  @Input() spinnerText: string;
  @Input() spinnerSize = 20;
  @Input() spinnerColor: string;
  @Input() active = true;
  @Input() isSpinning = false;
  @Input() mode;
  @Input() value;
  @Input() raised = true;
  @Input() fullWidth = true;
  @Input() buttonColor = 'primary';
}
