import {getExcelSheets} from './sourceDataXlsx.js';
import {DATA_GOV_URL_NOTARIES, DATA_GOV_URL_TRANSLATORS_INTERPRETERS, WEEK_IN_MILLISECONDS} from './constants.js';

setInterval(() => {
  getExcelSheets(DATA_GOV_URL_NOTARIES);
  getExcelSheets(DATA_GOV_URL_TRANSLATORS_INTERPRETERS);  
}, WEEK_IN_MILLISECONDS);

