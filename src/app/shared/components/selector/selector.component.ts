import * as _ from 'lodash';
import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output} from '@angular/core';

import {PaginationComponent} from '../pagination/pagination.component';

import {FormControl, FormGroup, FormBuilder} from '@angular/forms';
import {NSFOService} from '../../services/nsfo-api/nsfo.service';
import {SettingsService} from '../../services/settings/settings.service';
import {Constants} from '../../variables/constants';
import {NgxPaginationModule} from 'ngx-pagination';

@Component({
  selector: 'selector',
  providers: [NgxPaginationModule],
  directives: [PaginationComponent],
  templateUrl: './selector.component.html',
})

export class SelectorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isLoading: any;
  @Input() size = 'tiny';
  @Input() title = 'SELECT';
  @Input() sectionTitles: [] = [];
  @Input() columns: [] = [];
  @Input() list: [] = [];
  @Input() filter = 'NONE';
  @Input() initItem = null;
  @Input() allowCustomSelection = false;
  @Output() selection: EventEmitter = new EventEmitter();
  @Output() modalState: EventEmitter = new EventEmitter();
  @Input() SUGGESTION_LABEL: string;
  private countryCode$;
  private modalDisplay = 'none';
  private filteredList: [];
  private form: FormGroup;
  private country_code_list: any;

  constructor(private fb: FormBuilder, private nsfo: NSFOService,
              private settings: SettingsService, private constants: Constants) {
  }

  ngOnInit() {
    if (this.allowCustomSelection) {
      this.getCountryCodeList();

      this.form = this.fb.group({
        uid_country_code: new FormControl('NL'),
        uid_number: new FormControl('')
      });
    }
    this.modalState.emit(true);
  }

  ngOnChanges() {
    this.filterList();
  }

  ngOnDestroy() {
    if (this.allowCustomSelection) {
      this.countryCode$.unsubscribe();
    }
  }

  public openModal() {
    this.modalDisplay = 'block';
  }

  public closeModal() {
    this.modalState.emit(false);
    this.modalDisplay = 'none';
  }

  private getCountryCodeList() {
    this.countryCode$ = this.settings.getCountryList()
      .subscribe(countryCodeList => {
        this.country_code_list = countryCodeList;
      });
  }

  private selectItem(item) {
    this.selection.emit(item);
    this.closeModal();
  }


  private selectCustomItem() {
    const ulnCountryCode = this.form.get('uid_country_code').value;
    const ulnNumber = this.form.get('uid_number').value;

    const item = {
      uln: ulnCountryCode + ulnNumber,
      uln_number: ulnNumber,
      uln_country_code: ulnCountryCode
    };

    this.selection.emit(item);
    this.closeModal();
  }

  private filterList() {
    switch (this.filter) {
      case FilterType.None:
        this.filteredList = this.list;
        break;

      case FilterType.FemaleOnly:
        this.filteredList = _.filter(this.list, {'gender': 'FEMALE'});
        break;

      case FilterType.MalesOnly:
        this.filteredList = _.filter(this.list, {'gender': 'MALE'});
        break;
    }

    if (this.initItem) {
      this.filteredList = _.without(this.filteredList, this.initItem);
    }
  }
}

enum FilterType {
  None = 'NONE',
  FemaleOnly = 'FEMALES',
  MalesOnly = 'MALES'
}
