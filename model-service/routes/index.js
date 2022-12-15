import Office from '../entities/Office.js';
import {transformOfficeObjectToJsonLd} from '../utils/index.js';

export const routes = {
  office: async function(data, res) {
    if (data.method === 'get') {
      if (Object.keys(data.queryString).length == 0) {
        const payload = {
          message: "Expected parameters",
          code: 422
        };
        const payloadStr = JSON.stringify(payload);
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.writeHead(422);

        res.write(payloadStr);
        res.end("\n");

        return;
      } 

      if (Object.keys(data.queryString).length > 1 && data.queryString.id) {
        const payload = {
          message: "[id] parameter may only be used by itself",
          code: 422
        };
        const payloadStr = JSON.stringify(payload);
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.writeHead(422);

        res.write(payloadStr);
        res.end("\n");

        return;
      }

      if (data.queryString.id) {  
        const payload = await Office.getOfficeById(data.queryString.id);

        if (!payload) {
          const payload = {
            message: `No entity found with [id]: ${data.queryString.id}`,
            code: 200
          }
          const payloadStr = JSON.stringify(payload);
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.writeHead(200);

          res.write(payloadStr);
          res.end("\n");

          return;
        }

        const jsonldPayload = transformOfficeObjectToJsonLd(payload);

        const payloadStr = JSON.stringify(jsonldPayload);
        res.setHeader("Content-Type", "application/ld+json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.writeHead(200);

        res.write(payloadStr);
        res.end("\n");

        return;
      }
    } else if (data.method === 'put') {
      if (!data.requestPayload || Object.values(data.requestPayload).length === 0) {
        const payload = {
          message: "PUT request must have body",
          code: 400
        };
        const payloadStr = JSON.stringify(payload);
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.writeHead(400);
  
        res.write(payloadStr);
        res.end("\n");
  
        return;
      }

      if (!data.requestPayload['@id']) {
        const payload = {
          message: "PUT request must have body with [@id] field",
          code: 400
        };
        const payloadStr = JSON.stringify(payload);
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.writeHead(400);
  
        res.write(payloadStr);
        res.end("\n");
  
        return;
      }

    // TODO: use transform jsonld to object after figuring out reviews and services

      const isEntity = await Office.updateOffice(data.requestPayload);

      if (!isEntity) {
        const payload = {
          message: `No item with [@id]: ${data.requestPayload['@id']} found`,
          code: 400
        };
        const payloadStr = JSON.stringify(payload);
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.writeHead(400);
  
        res.write(payloadStr);
        res.end("\n");
  
        return;
      }

      const payload = {
        message: "Entity updated",
        code: 200
      };
      const payloadStr = JSON.stringify(payload);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.writeHead(200);

      res.write(payloadStr);
      res.end("\n");

      return;
    }
  },
  notFound: function(data, res) {
    let payload = {
      message: "File Not Found",
      code: 404
    };
    let payloadStr = JSON.stringify(payload);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(404);

    res.write(payloadStr);
    res.end("\n");
  }
};