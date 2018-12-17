import * as _ from 'lodash';
import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output} from '@angular/core';

import {FormControl, FormGroup, FormBuilder} from '@angular/forms';
import {NSFOService} from '../../services/nsfo-api/nsfo.service';
import {SettingsService} from '../../services/settings/settings.service';
import {Constants} from '../../variables/constants';
import {PaginationService} from 'ngx-pagination';

@Component({
  selector: 'selector',
  providers: [PaginationService],
  templateUrl: './selector.component.html',
})

export class SelectorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isLoading: any;
  @Input() size = 'tiny';
  @Input() title = 'SELECT';
  @Input() sectionTitles: any = [];
  @Input() columns: any = [];
  @Input() list: any = [];
  @Input() filter = 'NONE';
  @Input() initItem = null;
  @Input() allowCustomSelection = false;
  @Output() selection: EventEmitter<any> = new EventEmitter<any>();
  @Output() modalState: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Input() SUGGESTION_LABEL: string;
  public countryCode$;
  public modalDisplay = 'none';
  public filteredList: any;
  public form: FormGroup;
  public country_code_list: any;
  public page: number;

  constructor(private fb: FormBuilder, private nsfo: NSFOService,
              private settings: SettingsService, public constants: Constants) {
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
        this.country_code_list = countryCodeList[0];
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
