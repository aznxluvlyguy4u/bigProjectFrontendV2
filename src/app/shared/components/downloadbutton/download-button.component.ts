import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';


@Component({
  selector: 'app-download-button',
  templateUrl: './download-button.component.html',
  
})
export class DownloadButtonComponent implements OnInit {
  @Input() spinnerDurationSeconds = 0.5;
  @Input() successDurationSeconds = 3;
  @Input() labelText = 'DOWNLOAD';
  @Input() includeBadgeCount = false;
  @Input() badgeCount = 0;
  @Input() fontSize = '10px';
  @Input() includeDownloadIcon = false;
  @Input() title = 'download';
  @Input() isExpandedButton = true;
  @Input() extraDisabledCriteria = false;
  @Input() buttonSizeClass = 'tiny';
  @Output() click = new EventEmitter();
  private isActive = true;
  private showSuccess = false;
  private showSpinner = false;

  ngOnInit() {
    if (this.includeBadgeCount && this.badgeCount > 0) {
      this.isActive = false;
    } else {
      this.isActive = true;
    }
  }

  disableButton() {
    if (!this.isActive || this.extraDisabledCriteria) {
      return true;
    }

    if (this.includeBadgeCount) {
      return !(this.badgeCount > 0);
    }

    return false;
  }

  onClickyClick() {

    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.showSuccess = false;
    this.showSpinner = true;

    setTimeout(() => {
      this.showSpinner = false;
      this.showSuccess = true;

      // Prevent double clicking
      if (this.isActive) {
        this.click.emit(true);
      }

      setTimeout(() => {
        this.showSuccess = false;
        this.isActive = true;

      }, this.successDurationSeconds * 1000);

    }, this.spinnerDurationSeconds * 1000);
  }

}
