import AWS from 'aws-sdk';
import dotenv from 'dotenv';
import {safePromisify} from "../utils/index.js";

dotenv.config();

AWS.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY
});

const dynamoDb = new AWS.DynamoDB();

safePromisify(dynamoDb, ['getItem', 'updateItem']);

export default class Office {
  constructor(object) {
    this.id = object.id;
    this.averageRating = object.averageRating;
    this.reviews = object.reviews;
    this.name = object.name;
    this.location = object.location;
    this.contact = object.contact;
    this.type = object.type;
    this.services = object.services;
    this.timetable = object.timetable;
  }

  static async getOfficeById(officeId) {
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
  
    return item;
  }

  static async getOfficesFiltered(filters) {
    // filters.addressRegion
    // filters.reviewValue
    // filters.reviewCount
    // filters.type
    // filters.languages
    // filters.services
    // const parameters = {
    //   TableName: process.env.OFFICES_TABLE,
    //   Key: {
    //     OfficeId: {S: officeId}
    //   }
    // }
    

  }

  // TODO: continue adding reviews, contacts and services update capability
  static async updateOffice(office) {
    const officeItem = await this.getOfficeById(office["@id"]);

    if (!officeItem || Object.values(office).length === 0) {
      return false;
    }

    const parameters = {
      TableName: process.env.OFFICES_TABLE,
      Key: {
        OfficeId: {
          S: "testitem3"
        }
      },
      UpdateExpression: "SET Reviews = :reviews",
      ExpressionAttributeValues: {
        ":reviews": {
          L: [
            {
              M: {
                ReviewRating: {
                  N: "5",
                },
                ReviewTitle: {
                  S: "Title title"
                },
                ReviewBody: {
                  S: "Comment of review"
                },
                Creator: {
                  S: "ididid"
                }
              }
            }
          ]
        }
      }
    }

    console.log(parameters);

    dynamoDb.updateItem(parameters, (err) => {
      console.log(err);
    });

    return true;
  }
}