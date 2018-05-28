import moment = require('moment');
import {Component, EventEmitter, Input, OnChanges, OnInit, Output, ViewContainerRef} from '@angular/core';


@Component({
  selector: 'app-datepicker-v2',
  templateUrl: './datepicker-v2.component.html'
})
export class DatepickerV2Component implements OnInit, OnChanges {
  @Input() disabled = false;
  @Input() dateString: string;

  initialDateString: string;
  initialDateStringValueAfterReset: string;
  isDirty: boolean;

  public isOpened: boolean;
  public dateValue: string;
  public viewValue: string;
  public days: Array<Object>;
  public dayNames: Array<string>;
  today = moment().format('D MMM YYYY');
  @Input() modelFormat: string;
  @Input() viewFormat: string;
  @Input() firstWeekDaySunday: boolean;
  @Input() isStatic: boolean;
  @Input() activateSetNullButton = true;
  @Output() isDateStringChanged = new EventEmitter();
  @Output() isDateChanged: EventEmitter<Date> = new EventEmitter<Date>();
  private el: any;
  private date: any;
  private viewContainer: ViewContainerRef;
  private onChange: Function;
  private onTouched: Function;
  private cannonical: number;
  private nullDateString: string;

  constructor(viewContainer: ViewContainerRef) {
    this.viewContainer = viewContainer;
    this.el = viewContainer.element.nativeElement;
  }

  ngOnInit() {
    this.isDirty = false;
    this.isOpened = false;

    this.setInitialValue(this.dateString);
    this.setValue(this.dateString);

    this.firstWeekDaySunday = false;
    this.generateDayNames();
    this.generateCalendar(this.date);
    this.initMouseEvents();
  }

  public openDatepicker(): void {
    this.isOpened = true;
  }

  public closeDatepicker(): void {
    this.isOpened = false;
  }

  public prevYear(): void {
    this.date.subtract(1, 'Y');
    this.generateCalendar(this.date);
  }

  public prevMonth(): void {
    this.date.subtract(1, 'M');
    this.generateCalendar(this.date);
  }

  public nextYear(): void {
    this.date.add(1, 'Y');
    this.generateCalendar(this.date);
  }

  public nextMonth(): void {
    this.date.add(1, 'M');
    this.generateCalendar(this.date);
  }

  public selectDate(e, date): void {
    e.preventDefault();
    if (this.isSelected(date)) {
      return;
    }

    const selectedDate = moment(date.day + '.' + date.month + '.' + date.year, 'DD.MM.YYYY');
    this.setValue(selectedDate);
    this.closeDatepicker();

    this.changeDate(selectedDate.toDate());
  }

  isSelected(date) {
    const selectedDate = moment(date.day + '.' + date.month + '.' + date.year, 'DD.MM.YYYY');
    return selectedDate.toDate().getTime() === this.cannonical;
  }

  writeValue(value: string): void {
    if (!value) {
      return;
    }
    this.setValue(value);
  }

  registerOnChange(fn: (_: any) => {}): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: (_: any) => {}): void {
    this.onTouched = fn;
  }

  @Input()
  updateInitialValues() {
    this.setInitialValue(this.dateString);
    this.setValue(this.initialDateString);
  }

  ngOnChanges() {
    this.isDirty = !this.hasOriginalValues();
  }

  changeDate(selectedDate: Date) {
    this.isDateStringChanged.emit(this.dateString);
    this.isDateChanged.emit(selectedDate);
  }

  removeDate() {
    this.dateString = null;
    this.date = null;
    this.isDateStringChanged.emit(this.dateString);
    this.isDateChanged.emit(this.date);
  }

  setDate() {
    this.dateString = this.initialDateStringValueAfterReset;
    this.date = moment(this.dateString, this.modelFormat || 'DD-MM-YYYY');
    this.changeDate(this.date.toDate());
  }

  reset() {
    this.isDirty = false;

    this.dateString = this.initialDateString;
    this.setValue(this.dateString);

    this.changeDate(this.date.toDate());
  }

  hasOriginalValues(): boolean {
    return this.dateString === this.initialDateString;
  }

  viewValueWithNullCheck(): string {
    return this.dateString === null ? '' : this.viewValue;
  }

  private generateDayNames(): void {
    this.dayNames = [];
    const date = this.firstWeekDaySunday === true ? moment('2015-06-07') : moment('2015-06-01');
    for (let i = 0; i < 7; i += 1) {
      this.dayNames.push(date.format('ddd'));
      date.add('1', 'd');
    }
  }

  private generateCalendar(date): void {
    const lastDayOfMonth = date.endOf('month').date();
    const month = date.month();
    const year = date.year();
    let n = 1;
    let firstWeekDay = null;

    this.dateValue = date.format('MMMM YYYY');
    this.days = [];

    if (this.firstWeekDaySunday === true) {
      firstWeekDay = date.set('date', 2).day();
    } else {
      firstWeekDay = date.set('date', 1).day();
    }

    if (firstWeekDay !== 1) {
      n -= firstWeekDay - 1;
    }

    // Fix: In case the first day is on a sunday
    if (!this.firstWeekDaySunday && n === 2 && firstWeekDay === 0) {
      n = -5;
      firstWeekDay = -7;
    }

    for (let i = n; i <= lastDayOfMonth; i += 1) {
      if (i > 0) {
        this.days.push({day: i, month: month + 1, year: year, enabled: true});
      } else {
        this.days.push({day: null, month: null, year: null, enabled: false});
      }
    }
  }

  private initMouseEvents(): void {
    const body = document.getElementsByTagName('body')[0];

    body.addEventListener('click', (e) => {

      if (!this.isOpened || !e.target) {
        return;
      }

      if (this.el !== e.target && !this.el.contains(e.target)) {
        this.closeDatepicker();
      }

    }, false);
  }

  private setValue(value: any): void {
    if (value) {
      this.date = moment(value, this.modelFormat || 'DD-MM-YYYY');
      this.dateString = this.date.format(this.modelFormat);

    } else {
      this.date = moment();
      this.nullDateString = this.date.format(this.modelFormat);

      this.dateString = null;
    }

    this.viewValue = this.date.format(this.viewFormat || 'DD-MM-YYYY');
    this.cannonical = this.date.toDate().getTime();
  }

  private setInitialValue(value: any): void {
    if (value) {
      const val = moment(value, this.modelFormat || 'DD-MM-YYYY');
      this.initialDateString = val.format(this.modelFormat);
      this.initialDateStringValueAfterReset = this.initialDateString;
    } else {
      this.initialDateString = null;

      const val = moment();
      this.initialDateStringValueAfterReset = val.format(this.modelFormat);
    }
  }

}
