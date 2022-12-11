import {getExcelSheets} from './sourceDataXlsx.js';
import {DATA_GOV_URL_NOTARIES, DATA_GOV_URL_TRANSLATORS_INTERPRETERS} from './constants.js';

getExcelSheets(DATA_GOV_URL_NOTARIES);
getExcelSheets(DATA_GOV_URL_TRANSLATORS_INTERPRETERS);

