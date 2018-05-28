import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'invoiceFilter'
})

export class InvoiceFilterPipe implements PipeTransform {
  transform(list: any, args: string[]): any {
    const filterInput = args[0];
    const statusFilter = args[1];
    let filtered = list;

    if (statusFilter) {
      if (statusFilter === 'UNPAID INVOICES') {
        filtered = filtered.filter(invoice => {
          return invoice.status === 'UNPAID';
        });
      }

      if (statusFilter === 'NOT SEND INVOICES') {
        filtered = filtered.filter(invoice => {
          return invoice.status === 'NOT SEND';
        });
      }

      if (statusFilter === 'PAID INVOICES') {
        filtered = filtered.filter(invoice => {
          return invoice.status === 'PAID';
        });
      }

      if (statusFilter === 'INCOMPLETE INVOICES') {
        filtered = filtered.filter(invoice => {
          return invoice.status === 'INCOMPLETE';
        });
      }

      if (statusFilter === 'CANCELLED INVOICES') {
        filtered = filtered.filter(invoice => {
          return invoice.status === 'CANCELLED';
        });
      }
    }

    if (filterInput) {
      filterInput = args[0].toLocaleUpperCase();
      filtered = filtered.filter(invoice => (
        invoice.invoice_number +
        (invoice.invoice_date !== null ? invoice.invoice_date : '') +
        (invoice.paid_date !== null ? invoice.paid_date : '') +
        (invoice.company_name !== null ? invoice.company_name.toLocaleUpperCase() : '') +
        (invoice.company_vat_number !== null ? invoice.company_vat_number : '') +
        invoice.ubn +
        invoice.status
      ).indexOf(filterInput) !== -1);
    }
    return filtered;
  }
}
