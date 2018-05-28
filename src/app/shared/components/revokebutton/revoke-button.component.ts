import {TranslatePipe} from '@ngx-translate/core';
import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-revoke-button',
  templateUrl: './revoke-button.component.html',
  
})
export class RevokeButtonComponent {
  @Input() isActive = true;
  @Input() disabledLabel = 'REPEATED';

  @Output() click = new EventEmitter();

  sendRevokeRequest() {
    this.click.emit(true);
  }
}
