export const DATA_GOV_URL = 'https://data.gov.ro/api/3/action/package_show';
export const DATA_GOV_URL_NOTARIES = `${DATA_GOV_URL}?id=notari-publici`;
export const DATA_GOV_URL_TRANSLATORS_INTERPRETERS = `${DATA_GOV_URL}?id=traducatori-si-interpreti`;
export const DATA_GOV_REQUEST_OPTIONS = {
  method: 'GET',
  rejectUnauthorized: false
}
export const OFFICE_TYPES = {
  NOTARY: 'Notary',
  TRANSLATOR_INTERPRETER: 'Translator/Interpreter'
}