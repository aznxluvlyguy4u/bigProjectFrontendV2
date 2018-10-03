
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CacheService} from '../../services/settings/cache.service';

@Component({
  selector: 'app-revoke-button',
  templateUrl: './revoke-button.component.html'
})
export class RevokeButtonComponent {
  @Input() hasMessageNumber = true;
  @Input() disabledLabel = 'REPEATED';

  @Output() click = new EventEmitter();

  constructor(private cache: CacheService) {}

  sendRevokeRequest() {
    this.click.emit(true);
  }

  public isRepeatedDeclare(): boolean {
    return !this.hasMessageNumber && this.cache.useRvoLogic();
  }
}
