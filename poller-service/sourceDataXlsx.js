import https from 'https'; 
import fs from 'fs';
import { DATA_GOV_REQUEST_OPTIONS } from './constants.js';
import {getFilesNameByExtension} from './utils.js';
import {getConcatenatedNotaries, getConcatenatedTranslatorsAndInterpreters} from './xlsxParser.js';

function sourceData(url, fileIdentifier) {
  const file = fs.createWriteStream(`${fileIdentifier}.xlsx`);
  const req = https.request(url, {...DATA_GOV_REQUEST_OPTIONS}, (res) => {
    try {
      res.pipe(file);

      file.on('finish', async () => {
        file.close();
        console.log(`DOWNLOAD COMPLETE: ${fileIdentifier}. STARTING PARSING`);
        await getConcatenatedNotaries();
        await getConcatenatedTranslatorsAndInterpreters();
      });
    } catch (err) {
      console.error(err);
    }
  })

  req.end();
};

export function getExcelSheets(url) {
  const reqNotaries = https.request(url, {...DATA_GOV_REQUEST_OPTIONS}, (res) => {
    const resBuffer = [];
  
    res.on('data', (chunk) => {
      resBuffer.push(chunk);
    })
  
    res.on('end', async () => {
      try {
        const data = JSON.parse(Buffer.concat(resBuffer).toString());
        let downloadedResource;

        data.result.resources.forEach(resource => {
          if (!downloadedResource) {
            downloadedResource = resource;
            return;
          }

          if (Date.parse(downloadedResource.last_modified) < Date.parse(resource.last_modified)) {
            downloadedResource = resource;
          }
        });            
  
        const resourceType = downloadedResource.name.includes('Notari') ? 'Notar' : 'Traducator';
        const [existingFile] = await getFilesNameByExtension('./', 'xlsx', resourceType);
        const existingFileLastModified = existingFile?.match(/\[(.*?)\]/)?.[1]?.replaceAll('[', '');
        let existingFileLastModifiedUnix;

        if (existingFileLastModified) {
          existingFileLastModifiedUnix = Date.parse(existingFileLastModified);
        }

        if (existingFileLastModifiedUnix && existingFileLastModifiedUnix >= Date.parse(downloadedResource.last_modified)) {
          console.log("[XLSX DATA SOURCING] EXISTING FRESH FILE. ABANDONING DOWNLOAD");
          return;
        }

        console.log("[XLSX DATA SOURCING] FRESH RESOURCE LOCATED. CONTINUING DOWNLOAD");
        sourceData(downloadedResource.datagovro_download_url, `${downloadedResource.name.replaceAll(' ', '_')}[[${downloadedResource.last_modified}]]`);
      } catch (err) {
        console.error(err);
      }
    });
  });
  
  reqNotaries.on('error', (e) => {
    console.error(e);
  })
  
  reqNotaries.end(); 
}