import xlsx from 'node-xlsx';
import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import {getFilesNameByExtension} from './utils.js';
import {OFFICE_TYPES} from './constants.js';

dotenv.config();

AWS.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
});

const docClient = new AWS.DynamoDB.DocumentClient();

async function addNotary(notaryEntry = []) {
  let [fullName, room, address, city, county] = notaryEntry;
  let [name, firstName, otherFirstName] = fullName.split(" ");

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

  const params = {
    TableName: process.env.OFFICES_TABLE,
    Item: {
      Name: name,
      FirstName: firstName,
      Room: room,
      Address: address,
      City: city,
      County: county,
      Type: OFFICE_TYPES.NOTARY,
      OfficeId: notaryEntry.join('')
    }
  }

  docClient.put(params, function(err, data) {
    if(err) {
      console.log("[NOTARY ADDITION FAILED]: ERROR WHEN PUTTING IN NOTARY TABLE", err);
      return;
    }

    console.log("[NOTARY ADDITION SUCCESSFUL]: NOTARY ENTITY PUT IN NOTARY TABLE");
  })
}

async function addTranslatorInterpreter(translatorInterpreter = []) {
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

  const params = {
    TableName: process.env.OFFICES_TABLE,
    Item: {
      Name: name,
      FirstName: firstName,
      CourtOfAppeal: courtOfAppeal,
      Languages: languages,
      AuthorizationNumber: authorizationNumber,
      County: county,
      Contacts: contacts,
      Type: OFFICE_TYPES.TRANSLATOR_INTERPRETER,
      OfficeId: translatorInterpreter.join('')
    }
  }

  docClient.put(params, function(err, data) {
    if(err) {
      console.log("[TRANSLATOR-INTERPRETER ADDITION FAILED]: ERROR WHEN PUTTING IN TRANSLATOR-INTERPRETER TABLE", err);
      return;
    }

    console.log("[TRANSLATOR-INTERPRETER ADDITION SUCCESSFUL]: TRANSLATOR-INTERPRETER ENTITY PUT IN TRANSLATOR-INTERPRETER TABLE");
  })
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
  const fileNames = await getFilesNameByExtension('./', 'xlsx', 'Notari');
  let notaries = [];

  for (const fileName of fileNames) {
    notaries = [...notaries, ...parseXlsxFile(`./${fileName}`)];
  }

  for (let i = 0; i < notaries.length; i++) {
    console.log('[XLSX PARSER:NOTARY] THROTTLING DB INSERTION (250ms)');
    await new Promise(resolve => setTimeout(resolve, 250));
    console.log('[XLSX PARSER:NOTARY] STOP THROTTLING DB INSERTION (250ms)');
    await addNotary(notaries[i]);
  }
}

export async function getConcatenatedTranslatorsAndInterpreters() {
  const fileNames = await getFilesNameByExtension('./', 'xlsx', 'Traducatori');
  let translatorsAndInterpreters = [];

  for (const fileName of fileNames) {
    translatorsAndInterpreters = [...translatorsAndInterpreters, ...parseXlsxFile(`./${fileName}`)];
  }

  for (let i = 0; i < translatorsAndInterpreters.length; i++) {
    console.log('[XLSX PARSER:TRANSLATORS_INTERPRETERS] THROTTLING DB INSERTION (250ms)');
    await new Promise(resolve => setTimeout(resolve, 250));
    console.log('[XLSX PARSER:TRANSLATORS_INTERPRETERS] STOP THROTTLING DB INSERTION (250ms)');
    await addTranslatorInterpreter(translatorsAndInterpreters[i]);  
  }
}