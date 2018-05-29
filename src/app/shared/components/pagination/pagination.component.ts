import {
  AfterViewInit, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output,
  ViewChild
} from '@angular/core';
import {Subscription} from 'rxjs';
import {NgxPaginationModule, PaginationInstance} from 'ngx-pagination';

export interface IPage {
  label: string;
  value: any;
}

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
})

export class PaginationComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() id: string;
  @Input() maxSize = 7;
  @Output() pageChange: EventEmitter<number> = new EventEmitter<number>();
  @ViewChild('template') template;
  pages: IPage[] = [];
  private hasTemplate = false;
  private changeSub: Subscription;

  constructor(private service: NgxPaginationModule) {
    this.changeSub = this.service.change
      .subscribe(id => {
        if (this.id === id) {
          this.updatePageLinks();
        }
      });
  }

  private _directionLinks = true;

  @Input()
  get directionLinks(): boolean {
    return this._directionLinks;
  }

  set directionLinks(value: boolean) {
    this._directionLinks = !!value && <any>value !== 'false';
  }

  private _autoHide = false;

  @Input()
  get autoHide(): boolean {
    return this._autoHide;
  }

  set autoHide(value: boolean) {
    this._autoHide = !!value && <any>value !== 'false';
  }

  ngOnInit() {
    if (this.id === undefined) {
      this.id = this.service;
    }
  }

  ngOnChanges() {
    this.updatePageLinks();
  }

  ngAfterViewInit() {
    if ((this.template) && 0 < this.template.nativeElement.children.length) {
      setTimeout(() => this.hasTemplate = true);
    }
  }

  ngOnDestroy() {
    this.changeSub.unsubscribe();
  }

  /**
   * Go to the previous page
   */
  previous() {
    this.setCurrent(this.getCurrent() - 1);
  }

  /**
   * Go to the next page
   */
  next() {
    this.setCurrent(this.getCurrent() + 1);
  }

  /**
   * Returns true if current page is first page
   */
  isFirstPage(): boolean {
    return this.getCurrent() === 1;
  }

  /**
   * Returns true if current page is last page
   */
  isLastPage(): boolean {
    return this.getLastPage() === this.getCurrent() || this.getLastPage() === 0;
  }

  /**
   * Set the current page number.
   */
  setCurrent(page: number) {
    this.pageChange.emit(page);
  }

  /**
   * Get the current page number.
   */
  getCurrent(): number {
    return this.service.getCurrentPage(this.id);
  }

  /**
   * Returns the last page number
   */
  getLastPage(): number {
    const inst = this.service.getInstance(this.id);
    return Math.ceil(inst.totalItems / inst.itemsPerPage);
  }

  /**
   * Updates the page links and checks that the current page is valid. Should run whenever the
   * NgxPaginationModule.change stream emits a value matching the current ID, or when any of the
   * input values changes.
   */
  private updatePageLinks() {
    const inst = this.service.getInstance(this.id);
    this.pages = this.createPageArray(inst.currentPage, inst.itemsPerPage, inst.totalItems, this.maxSize);

    const correctedCurrentPage = this.outOfBoundCorrection(inst);
    if (correctedCurrentPage !== inst.currentPage) {
      this.setCurrent(correctedCurrentPage);
    }
  }

  /**
   * Checks that the instance.currentPage property is within bounds for the current page range.
   * If not, return a correct value for currentPage, or the current value if OK.
   */
  private outOfBoundCorrection(instance: PaginationInstance): number {
    const totalPages = Math.ceil(instance.totalItems / instance.itemsPerPage);
    if (totalPages < instance.currentPage && 0 < totalPages) {
      return totalPages;
    } else if (instance.currentPage < 1) {
      return 1;
    }

    return instance.currentPage;
  }

  /**
   * Returns an array of IPage objects to use in the pagination controls.
   */
  private createPageArray(currentPage: number, itemsPerPage: number, totalItems: number, paginationRange: number): IPage[] {
    // paginationRange could be a string if passed from attribute, so cast to number.
    paginationRange = +paginationRange;
    const pages = [];
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const halfWay = Math.ceil(paginationRange / 2);

    const isStart = currentPage <= halfWay;
    const isEnd = totalPages - halfWay < currentPage;
    const isMiddle = !isStart && !isEnd;

    const ellipsesNeeded = paginationRange < totalPages;
    let i = 1;

    while (i <= totalPages && i <= paginationRange) {
      let label;
      const pageNumber = this.calculatePageNumber(i, currentPage, paginationRange, totalPages);
      const openingEllipsesNeeded = (i === 2 && (isMiddle || isEnd));
      const closingEllipsesNeeded = (i === paginationRange - 1 && (isMiddle || isStart));
      if (ellipsesNeeded && (openingEllipsesNeeded || closingEllipsesNeeded)) {
        label = '...';
      } else {
        label = pageNumber;
      }
      pages.push({
        label: label,
        value: pageNumber
      });
      i++;
    }
    return pages;
  }

  /**
   * Given the position in the sequence of pagination links [i],
   * figure out what page number corresponds to that position.
   */
  private calculatePageNumber(i: number, currentPage: number, paginationRange: number, totalPages: number) {
    const halfWay = Math.ceil(paginationRange / 2);
    if (i === paginationRange) {
      return totalPages;
    } else if (i === 1) {
      return i;
    } else if (paginationRange < totalPages) {
      if (totalPages - halfWay < currentPage) {
        return totalPages - paginationRange + i;
      } else if (halfWay < currentPage) {
        return currentPage - halfWay + i;
      } else {
        return i;
      }
    } else {
      return i;
    }
  }
}
