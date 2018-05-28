import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-check-mark',
  templateUrl: './check-mark.component.html'
})
export class CheckMarkComponent {
  @Input() boolVal: boolean;
}
