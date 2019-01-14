import { NSFOService } from '../nsfo-api/nsfo.service';
import { PedigreeRegister } from '../../models/pedigree-register.model';
import { Injectable } from '@angular/core';
import {JsonResponseModel} from '../../models/json-response.model';
import {API_URI_GET_PEDIGREE_REGISTERS} from '../nsfo-api/nsfo.settings';

import * as _ from 'lodash';

@Injectable()
export class PedigreeRegisterStorage {

	pedigreeRegisters: PedigreeRegister[] = [];

	constructor(private api: NSFOService) {}

	initialize() {
		if (this.pedigreeRegisters.length === 0) {
			this.refresh();
		}
	}

	refresh() {
		this.doGetPedigreeRegisters();
	}

	private doGetPedigreeRegisters() {
		this.api.doGetRequest(API_URI_GET_PEDIGREE_REGISTERS)
			.subscribe(
        (res: JsonResponseModel) => {
					this.pedigreeRegisters = <PedigreeRegister[]> res.result;
				},
				error => {
					alert(this.api.getErrorMessage(error));
				}
			);
	}

	getById(id: number): PedigreeRegister {
		if (id == null) {
			return null;
		}

		if (typeof id === 'string') {
			// convert the string to a number
			id = +id;
		}

		return _.find(this.pedigreeRegisters,{id: id} );
	}

	static arePedigreeRegistersEqual(p1: PedigreeRegister, p2: PedigreeRegister): boolean {
		if (p1 == null) {
			return p2 == null;

		} else {
			if (p2 == null) {
				return false;
			}

			return p1.id === p2.id
				&& p1.abbreviation === p2.abbreviation
				&& p1.full_name === p2.full_name
			;
		}
	}
}
