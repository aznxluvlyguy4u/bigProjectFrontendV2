import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';


@Component({
  selector: 'app-file-type-dropdown',
  templateUrl: './file-type-dropdown.component.html'
})
export class FileTypeDropdownComponent implements OnInit {

  selectedFileType: string;
  @Input() fileTypeOptions: string[];
  @Output() fileTypeChange = new EventEmitter<string>();

  constructor() {
  }

  ngOnInit() {
    this.selectedFileType = this.fileTypeOptions[0];
  }

  onClickyClick(event) {
    this.fileTypeChange.emit(event);
  }
}
