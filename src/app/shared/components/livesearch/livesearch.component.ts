import {Component, EventEmitter, Input, OnChanges, Output} from '@angular/core';
import {LivesearchFilterPipe} from './pipes/livesearchFilter';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'livesearch',
  templateUrl: './livesearch.component.html',
  pipes: [LivesearchFilterPipe, TranslatePipe]
})

export class LiveSearchComponent implements OnChanges {
  @Input() searchTitle: string;
  @Input() editMode: boolean;
  @Input() list: Array<Object>;
  @Input() searchQuery = '';
  @Output() selected: EventEmitter<any> = new EventEmitter<any>();
  @Output() searchQueryChange: EventEmitter<any> = new EventEmitter<any>();
  private livesearchEnabled = false;

  ngOnChanges() {
    if (!this.editMode) {
      this.enableLivesearch(false);
    }
  }

  private enableLivesearch(toggle: boolean) {
    this.livesearchEnabled = toggle;
  }

  private selectObject(selectedObject) {
    this.selected.emit(selectedObject);
  }

  private changeSearchQuery() {
    if (this.searchQuery) {
      this.searchQueryChange.emit(this.searchQuery);
    }
  }
}
