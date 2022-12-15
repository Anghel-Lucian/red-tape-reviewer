import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import {transformOfficeObjectToJsonLd, safePromisify} from '../utils/index.js';

dotenv.config();

AWS.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
});

const dynamoDb = new AWS.DynamoDB();

safePromisify(dynamoDb, ['getItem']);

const getOffice = async (officeId) => {
  console.log("getOffice");
  console.log(officeId);

  const parameters = {
    TableName: process.env.OFFICES_TABLE,
    Key: {
      OfficeId: {S: officeId}
    }
  }

  const result = await dynamoDb.getItemAsync(parameters);

  if (!result || Object.values(result).length === 0 || !result.Item) {
    console.log("No item found in DynamoDb");
    return;
  }

  console.log("Success when getting office");
  let item = {};

  Object.entries(result.Item).forEach(([key, value]) => {
    if (value.S) {
      item[key] = value.S;
    } else if (value.N) {
      item[key] = value.N;
    }
  }, {});
  // console.log(transformOfficeObjectToJsonLd(item)); TODO:

  return item;
}

const postOffice = async (data, res) => {
  console.log("postOffice");
}

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
        const payload = await getOffice(data.queryString.id);
        console.log(payload);
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

        const payloadStr = JSON.stringify(payload);
        res.setHeader("Content-Type", "application/ld+json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.writeHead(200);

        res.write(payloadStr);
        res.end("\n");

        return;
      }
    } else if (data.method === 'post') {

    }

    // res.setHeader("Content-Type", "application/ld+json");
    // res.setHeader("Access-Control-Allow-Origin", "*");
    // res.writeHead(httpCode);
    // res.end("\n");
  },
  cartman: function(data, res) {
    // this function called if the path is 'cartman'
    let payload = {
      name: "Cartman"
    };
    let payloadStr = JSON.stringify(payload);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(200);
    res.write(payloadStr);
    res.end("\n");
  },
  "kenny/is/mysterion": function(data, res) {
    //this function called if path is 'kenny/is/mysterion'
    let payload = {
      name: "Mysterion",
      enemy: "The Coon",
      today: +new Date()
    };
    let payloadStr = JSON.stringify(payload);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(200);
    res.write(payloadStr);
    res.end("\n");
  },
  notFound: function(data, res) {
    //this one gets called if no route matches
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