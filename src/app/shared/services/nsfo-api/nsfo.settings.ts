// GENERAL
export const UBN_TOKEN_NAMESPACE = 'ubn_token';
export const ACCESS_TOKEN_NAMESPACE = 'access_token';
export const GHOST_TOKEN_NAMESPACE = 'ghost_token';
export const UBN_LOCATION_NAMESPACE = 'location_token';
export const API_URI_GET_USER_INFO = '/v1/components/menu-bar';
export const API_URI_GET_COUNTRY_CODES = '/v1/countries?continent=europe';
export const API_URI_GET_STATE_CODES = '/v1/countries/nl/provinces';
export const API_URI_REVOKE_DECLARATION = '/v1/revokes';
export const API_URI_HIDE_ERROR = '/v1/errors';
// GHOST LOGIN
export const API_URI_VERIFY_GHOST_TOKEN = '/v1/admins/verify-ghost-token';

export const API_URI_GET_REPORTS = '/v1/reports';


// LIVESTOCK
export const API_URI_GET_ANIMALS = '/v1/animals-livestock';
export const API_URI_GET_HISTORIC_ANIMALS = '/v1/animals-historic-livestock';
export const API_URI_GET_ANIMAL_DETAILS = '/v1/animals-details';
export const API_URI_CHANGE_ANIMAL_DETAILS = '/v1/animals-details';
export const API_URI_SYNC_ANIMALS = '/v1/animals-sync';
export const API_URI_SYNC_ANIMALS_RVO_LEADING = '/v1/animals-sync/rvo-leading';
export const API_URI_GET_EWES_IN_LIVESTOCK = '/v1/animals-livestock?gender=female';
export const API_URI_GET_HISTORIC_EWES_IN_LIVESTOCK = '/v1/animals-historic-livestock?gender=female';

// MEASUREMENTS
export const API_URI_MEASUREMENTS = '/v1/measurements';

// CONTACT PAGE
export const API_URI_SEND_MESSAGE = '/v1/contacts';

// COMPANY PROFILE
export const API_URI_GET_COMPANY_PROFILE = '/v1/profiles/company';
export const API_URI_CHANGE_COMPANY_PROFILE = '/v1/profiles/company';
export const API_URI_GET_COMPANY_LOGIN = '/v1/profiles/login-info';
export const API_URI_RESET_PASSWORD = '/v1/auth/password-reset';
export const API_URI_CHANGE_PASSWORD = '/v1/auth/password-change';
export const API_URI_CHANGE_EMAIL = '/v1/auth/email-change';

// DASHBOARD
export const API_URI_GET_DASHBOARD_INFO = '/v1/dashboard';

// EARTAGS
export const API_URI_GET_EARTAGS = '/v1/tags';
export const API_URI_GET_EARTAGS_HISTORY = '/v1/tags-transfers-history';
export const API_URI_GET_EARTAGS_ERRORS = '/v1/tags-transfers-errors';
export const API_URI_SYNC_EARTAGS = '/v1/tags-sync';
export const API_URI_TRANSFER_EARTAGS = '/v1/tags-transfers';

// ARRIVAL
export const API_URI_DECLARE_ARRIVAL = '/v1/arrivals';
export const API_URI_CHANGE_ARRIVAL = '/v1/arrivals';
export const API_URI_GET_ARRIVALS_HISTORY = '/v1/arrivals-history';
export const API_URI_GET_ARRIVALS_ERRORS = '/v1/arrivals-errors';

// DEPART
export const API_URI_DECLARE_DEPART = '/v1/departs';
export const API_URI_CHANGE_DEPART = '/v1/departs';
export const API_URI_GET_DEPARTS_HISTORY = '/v1/departs-history';
export const API_URI_GET_DEPARTS_ERRORS = '/v1/departs-errors';

// BIRTH
export const API_URI_DECLARE_BIRTH = '/v1/births';
export const API_URI_DECLARE_FALSE_BIRTH = '/v1/births/false-birth';
export const API_URI_REVOKE_BIRTH = '/v1/births/revoke';
export const API_URI_CHANGE_BIRTH = '/v1/births';
export const API_URI_GET_BIRTHS_HISTORY = '/v1/births';
export const API_URI_GET_BIRTH_DETAILS = '/v1/births';
export const API_URI_GET_BIRTHS_ERRORS = '/v1/births-errors';

// INVOICE
export const API_URI_INVOICES = '/v1/invoices';
export const API_URI_INVOICE_PAYMENT = '/v1/mollie';

// LOSS
export const API_URI_DECLARE_LOSS = '/v1/losses';
export const API_URI_CHANGE_LOSS = '/v1/losses';
export const API_URI_GET_LOSS_HISTORY = '/v1/losses-history';
export const API_URI_GET_LOSS_ERRORS = '/v1/losses-errors';
export const API_URI_GET_UBN_PROCESSORS = '/v1/ubns/processors';

// MATE
export const API_URI_DECLARE_MATE = '/v1/matings';
export const API_URI_CHANGE_MATE = '/v1/matings';
export const API_URI_GET_MATE_HISTORY = '/v1/matings-history';
export const API_URI_REVOKE_MATE = '/v1/revokes-nsfo';
export const API_URI_HIDE_ERRORS_MATE = '/v1/revokes-nsfo';
export const API_URI_GET_MATE_ERRORS = '/v1/matings-errors';
export const API_URI_GET_MATE_PENDING = '/v1/matings-pending';

// WEIGHTS
export const API_URI_DECLARE_WEIGHT = '/v1/animals-weights';
export const API_URI_CHANGE_WEIGHT = '/v1/animals-weights';
export const API_URI_GET_WEIGHT_HISTORY = '/v1/animals-weights-history';
export const API_URI_REVOKE_WEIGHT = '/v1/revokes-nsfo';

// MESSAGES
export const API_URI_GET_MESSAGES = '/v1/messages';
export const API_URI_CHANGE_MESSAGES_READ_STATUS = '/v1/messages/read';

// TAG REPLACEMENT
export const API_URI_DECLARE_TAG_REPLACEMENT = '/v1/tags-replace';
export const API_URI_GET_TAG_REPLACEMENT_ERRORS = '/v1/tags-replace-errors';
export const API_URI_GET_TAG_REPLACEMENT_HISTORY = '/v1/tags-replace-history';

// CMS
export const API_URI_GET_CMS = '/v1/cms';

// REPORT
export const API_URI_GET_LINEAGE_PROOF = '/v1/reports/pedigree-certificates';
export const API_URI_GET_INBREEDING_COEFFICIENT = '/v1/reports/inbreeding-coefficients';
export const API_URI_GET_LIVESTOCK_DOCUMENT = '/v1/reports/livestock';
export const API_URI_GET_OFFSPRING_REPORT = '/v1/reports/offspring';
export const API_URI_GET_FERTILIZER_ACCOUNTING_REPORT = '/v1/reports/fertilizer-accounting';
export const API_URI_GET_BIRTH_LIST_REPORT = '/v1/reports/birth-list';
export const API_URI_GET_EWE_CARD_REPORT = '/v1/reports/ewe-card';

// Pedigree Register
export const API_URI_GET_PEDIGREE_REGISTERS = '/v1/pedigreeregisters';

// GENDER
export const API_URI_ANIMAL_GENDER = '/v1/animals-gender';

// NICKNAME
export const API_URI_ANIMAL_NICKNAME = '/v1/animals-nickname';

// COLLAR Colors
export const API_URI_GET_COLLAR_COLORS = '/v1/collars';
