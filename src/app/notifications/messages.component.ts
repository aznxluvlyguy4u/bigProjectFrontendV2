import * as moment from 'moment';
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {Router} from '@angular/router';
import {NSFOService} from '../shared/services/nsfo-api/nsfo.service';
import {UtilsService} from '../shared/services/utils/utils.services';
import {SettingsService} from '../shared/services/settings/settings.service';
import {API_URI_CHANGE_MESSAGES_READ_STATUS} from '../shared/services/nsfo-api/nsfo.settings';

import {Message} from '../shared/models/message.model';
import {NgxPaginationModule} from 'ngx-pagination';

@Component({
  providers: [NgxPaginationModule],
  templateUrl: './messages.component.html',
})

export class MessagesComponent implements OnInit {
  private messages: Message[] = [];
  private selectedMessage: Message = null;
  private initMessageNumber = '';
  private modalDisplay = 'none';

  constructor(private route: ActivatedRoute,
              private nsfo: NSFOService,
              private utils: UtilsService,
              private settings: SettingsService,
              private router: Router) {
  }

  ngOnInit() {
    this.getMessages();

    this.route.params
      .subscribe(
        params => {
          this.utils.getMessages()
            .subscribe(res => {
              this.messages = res;
              this.initMessageNumber = params['id'];
              const here = this;
              const message = this.messages.find(k => k.message_id === this.initMessageNumber);
              if (message) {
                if (!message.is_read) {
                  this.openMessage(message);
                }
              }
            });
        }
      );
  }

  private getMessages() {
    this.utils.getMessages()
      .subscribe(res => {
        this.messages = res;
      });
  }

  private changeReadStatus(message: Message): void {
    message.is_read = true;
    this.nsfo.doPutRequest(API_URI_CHANGE_MESSAGES_READ_STATUS + '/' + message.message_id, {})
      .subscribe(res => {
      });
  }

  private openMessage(message: Message): void {
    this.selectedMessage = message;
    this.changeReadStatus(message);
    this.openModal();
  }

  private navigateTo(route: string) {
    this.router.navigate([route]);
  }

  private stringAsViewDateTime(date) {
    return moment(date).format(this.settings.getViewDateTimeFormat());
  }

  private openModal() {
    this.modalDisplay = 'block';
  }

  private closeModal() {
    this.modalDisplay = 'none';
  }
}

