import xlsx from 'node-xlsx';
import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import {getFilesNameByExtension} from './utils.js';
import {OFFICE_TYPES} from './constants.js';
import marklogic from 'marklogic';

dotenv.config();

const db = marklogic.createDatabaseClient({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  authType: process.env.DB_AUTH_TYPE
})

function addNotary(notaryEntry = []) {
  let [fullName, room, address, city, county] = notaryEntry;
  let [name, firstName, otherFirstName] = fullName?.split(" ");

  if (otherFirstName) {
    firstName = `${firstName} ${otherFirstName}`;
  }

  if (name == 'NULL') {
    name = undefined;
  }
  if (firstName == 'NULL') {
    firstName = undefined;
  }
  if (room == 'NULL') {
    room = undefined;
  }
  if (address == 'NULL') {
    address = undefined;
  }
  if (city == 'NULL') {
    city = undefined;
  }
  if (county == 'NULL') {
    county = undefined;
  }

  const id = notaryEntry.join('').replaceAll(' ', '').toLowerCase();
  const uri = `http://red-tape-reviewer.com/offices/${id}`;
  const addressUri = `http://red-tape-reviewer.com/addresses/${id}`;
  const queryRows = [
    'PREFIX schema: <http://schema.org/>',
    'INSERT DATA {',
    ` <${uri}> schema:identifier "${id}" .`,
    ` ${name ? `<${uri}> schema:name "${name} ${firstName}" .` : ''}`,
    ` <${uri}> schema:additionalType schema:Notary .`,
    ` ${room || address || city || county ? `<${uri}> schema:address <${addressUri}> .` : ''}`,
    ` ${city || room || county ? `<${addressUri}> schema:addressRegion "${city || room || county}" .` : ''}`,
    ` ${address ? `<${addressUri}> schema:streetAddress "${address}" .` : ''}`,
    `}`
  ];

  let sparqlQuery = '';

  for (let row of queryRows) {
    if (row) {
      sparqlQuery += row + '\n';
    }
  }

  db.graphs.sparqlUpdate(sparqlQuery);
}

function addTranslatorInterpreter(translatorInterpreter = []) {
  let [fullName, courtOfAppeal, languages, authorizationNumber, county, contacts] = translatorInterpreter;
  let [name, firstName, otherFirstName] = fullName?.split(" ");

  if (otherFirstName) {
    firstName = `${firstName} ${otherFirstName}`;
  }

  if (name == 'NULL') {
    name = undefined;
  }
  if (firstName == 'NULL') {
    firstName = undefined;
  }
  if (courtOfAppeal == 'NULL') {
    courtOfAppeal = undefined;
  }
  if (languages == 'NULL') {
    languages = undefined;
  }
  if (authorizationNumber == 'NULL') {
    authorizationNumber = undefined;
  }
  if (county == 'NULL') {
    county = undefined;
  }
  if (contacts == 'NULL') {
    contacts = undefined;
  }
  if (languages) {
    languages = languages.split(",")
  }

  const id = translatorInterpreter.join('').replaceAll(' ', '').toLowerCase();
  const uri = `http://red-tape-reviewer.com/offices/${id}`;
  const addressUri = `http://red-tape-reviewer.com/addresses/${id}`;
  const offerCatalogUri = `http://red-tape-reviewer.com/offers/${id}`;
  let languageOffers = [];

  languages?.forEach(language => {
    const sanitizedLanguage = language.trim();
    const languageUri = `${offerCatalogUri}/${sanitizedLanguage}`;

    languageOffers.push(`<${offerCatalogUri}> schema:itemListElement <${languageUri}> .`);
    languageOffers.push(`<${languageUri}> schema:name <${sanitizedLanguage}> .`);
  });

  const queryRows = [
    'PREFIX schema: <http://schema.org/>',
    'INSERT DATA {',
    ` <${uri}> schema:identifier "${id}" .`,
    ` <${uri}> schema:additionalType schema:LocalBusiness .`,
    ` ${name ? `<${uri}> schema:name "${name} ${firstName}" .` : ''}`,
    ` ${county ? `<${uri}> schema:address <${addressUri}> .` : ''}`,
    ` ${county ? `<${addressUri}> schema:addressRegion "${county}" .` : ''}`,
    ` ${languages ? `<${uri}> schema:hasOfferCatalog <${offerCatalogUri}> .` : ''}`,
    ` ${languages ? languageOffers.join("\n") : ''}`,
    ` ${contacts ? `<${uri}> schema:telephone "${contacts}"` : ''}`,
    `}`
  ];

  let sparqlQuery = '';

  for (let row of queryRows) {
    if (row) {
      sparqlQuery += row + '\n';
    }
  }

  db.graphs.sparqlUpdate(sparqlQuery);
}

function parseXlsxFile(path) {
  try {
    const workSheetsFromFile = xlsx.parse(path);

    if (!workSheetsFromFile || !workSheetsFromFile.length) {
      throw Error('[XLSX PARSER] NO RESULTS FOR PARSED WORKSHEET. TERMINATING PARSING');
    }

    const dataArray = workSheetsFromFile[0].data.slice(3);

    if (!dataArray || !dataArray.length) {
      throw Error('[XLSX PARSER] NO DATA IN PARSED WORKSHEET. TERMINATING');
    }

    return dataArray;
  } catch(e) {
    console.error(e);
  }

  return [];
}

export async function getConcatenatedNotaries() {
  console.log('[XLSX PARSER]: LOADING NOTARIES IN DB');
  const fileNames = await getFilesNameByExtension('./', 'xlsx', 'Notari');
  let notaries = [];

  for (const fileName of fileNames) {
    notaries = [...notaries, ...parseXlsxFile(`./${fileName}`)];
  }

  for (let i = 0; i < notaries.length; i++) {
    addNotary(notaries[i]);
  }
}

export async function getConcatenatedTranslatorsAndInterpreters() {
  console.log('[XLSX PARSER]: LOADING TRANSLATORS-INTERPRETERS IN DB');
  const fileNames = await getFilesNameByExtension('./', 'xlsx', 'Traducatori');
  let translatorsAndInterpreters = [];

  for (const fileName of fileNames) {
    translatorsAndInterpreters = [...translatorsAndInterpreters, ...parseXlsxFile(`./${fileName}`)];
  }

  for (let i = 0; i < translatorsAndInterpreters.length; i++) {
    addTranslatorInterpreter(translatorsAndInterpreters[i]);  
  }
}