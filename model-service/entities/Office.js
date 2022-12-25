import dotenv from 'dotenv';
import marklogic from 'marklogic';
import { getCoordinates } from '../utils/index.js';
import crypto from 'crypto';

dotenv.config();

const db = marklogic.createDatabaseClient({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  authType: process.env.DB_AUTH_TYPE
})

export default class Office {
  constructor(object) {
    this.id = object.id;
    this.averageRating = object.averageRating;
    this.reviews = object.reviews;
    this.name = object.name;
    this.address = object.address;
    this.telephone = object.telephone;
    this.type = object.type;
    this.offerCatalog = object.offerCatalog;
    this.openingHours = object.openingHours;
  }

  static async getOfficeById(officeId) {
    const query =`
      PREFIX schema: <http://schema.org/>
      PREFIX rdf: <https://www.w3.org/1999/02/22-rdf-syntax-ns#>
      
      SELECT ?name ?type ?telephone ?openingHours ?addressRegion ?streetAddress ?longitude ?latitude ?mapHostUrl ?offerCatalog WHERE { 
        ?s schema:name ?name .
        ?s rdf:type ?type .
      
        OPTIONAL {
          ?s schema:telephone ?telephone .
        }

        OPTIONAL {
          ?s schema:openingHours ?openingHours .
        }

        OPTIONAL {
          ?s schema:longitude ?longitude .
        }
      
        OPTIONAL {
          ?s schema:latitude ?latitude .
        }
      
        OPTIONAL {
          ?s schema:hasOfferCatalog ?offerCatalog .
        }
        
        OPTIONAL {
          { SELECT ?mapHostUrl WHERE {
              OPTIONAL {
                ?s schema:archivedAt ?mapHostUrl .
              }
      
              FILTER (?s = <http://red-tape-reviewer.com/maps/${officeId}>)
            }
          }
        }
        
        { SELECT ?addressRegion ?streetAddress WHERE {
            ?s schema:addressRegion ?addressRegion .
      
            OPTIONAL {
              ?s schema:streetAddress ?streetAddress .        
            }
      
            FILTER (?s = <http://red-tape-reviewer.com/addresses/${officeId}>)
          }
        }
      
        FILTER (?s = <http://red-tape-reviewer.com/offices/${officeId}>)
      }
    `;

    const office = await db.graphs.sparql('application/sparql-results+json', query).result();

    if (!office || !office.results || !office.results.bindings || !office.results.bindings.length || !Object.values(office.results.bindings[0]).length) {
      return null;
    }

    let officeData = Object.entries(office.results.bindings[0]).reduce((prevObj, [key, {value}]) => {
      if (!value) {
        return;
      }

      return {
        ...prevObj,
        [key]: value
      };
    }, {});

    if (officeData.offerCatalog) {
      const catalogQuery = `
        PREFIX schema: <http://schema.org/>
        PREFIX rdf: <https://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT ?name ?price ?description WHERE {
          ?s rdf:type schema:Offer .
          ?s schema:offeredBy <http://red-tape-reviewer.com/offices/${officeId}> .
          ?s schema:name ?name .

          OPTIONAL {
            ?s schema:price ?price .
          }

          OPTIONAL {
            ?s schema:description ?description .
          }
        }
      `;

      const services = await db.graphs.sparql('application/sparql-results+json', catalogQuery).result();

      let servicesData = [];

      if (!services || !services.results || !services.results.bindings || !services.results.bindings.length) {
        servicesData = [];
      } else {
        services.results.bindings.forEach(service => {
          const serviceObj = Object.entries(service).reduce((prevObj, [key, {value}]) => {
            if (!value) {
              return;
            }

            return {
              ...prevObj,
              [key]: value
            }
          }, {})

          servicesData.push(serviceObj);
        });

        officeData.offerCatalog = servicesData;
      }
    }

    // TODO: handle reviews and aggregate rating
    console.log(officeData);
    return officeData;
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

  static async updateOffice(office) {
    if (!office.id) {
      return { message: "office parameter must contain 'id' field" };
    }

    const askQuery = `
      ASK { <http://red-tape-reviewer.com/offices/${office.id}> ?p ?o }
    `;

    const askQueryResult = await db.graphs.sparql('application/sparql-results+json', askQuery).result();
    
    if (!askQueryResult.boolean) {
      return { message: `office with id ${office.id} does not exist` };
    }

    if (office.telephone) {
      const insertTelephoneIfNotExistQuery = `
        PREFIX schema: <http://schema.org/>

        INSERT { 
          <http://red-tape-reviewer.com/offices/${office.id}> schema:telephone "${office.telephone}" .
        } 
        WHERE {
          FILTER NOT EXISTS { <http://red-tape-reviewer.com/offices/${office.id}> schema:telephone ?o } 
        }
      `;

      await db.graphs.sparqlUpdate(insertTelephoneIfNotExistQuery);
    }

    if (office.openingHours) {
      const insertOpeningHoursIfNotExistQuery = `
        PREFIX schema: <http://schema.org/>

        INSERT { 
          <http://red-tape-reviewer.com/offices/${office.id}> schema:openingHours "${office.openingHours}" .
        } 
        WHERE {
          FILTER NOT EXISTS { <http://red-tape-reviewer.com/offices/${office.id}> schema:openingHours ?o } 
        }
      `;

      await db.graphs.sparqlUpdate(insertOpeningHoursIfNotExistQuery);
    }

    if (office.offerCatalog?.length) {
      const offerCatalogExistsQuery = `
        PREFIX schema: <http://schema.org>

        ASK { <http://red-tape-reviewer.com/offers/${office.id}> ?p ?o }
      `;

      const offerCatalogExistsQueryResult = await db.graphs.sparql('application/sparql-results+json', offerCatalogExistsQuery).result();
      const offerCatalogUri = `http://red-tape-reviewer.com/offers/${office.id}`

      // if offer catalog doesn't exist, create one
      if (!offerCatalogExistsQueryResult.boolean) {
        const insertOfferCatalogQuery = `
          PREFIX schema: <http://schema.org>

          INSERT DATA {
            <http://red-tape-reviewer.com/offices/${office.id}> schema:hasOfferCatalog <${offerCatalogUri}> .
          }
        `;

        await db.graphs.sparqlUpdate(insertOfferCatalogQuery);
      }

      // for each offerCatalog item in the payload, create or update one
      office.offerCatalog.forEach(async offer => {
        const offerNameExistsQuery = `
          PREFIX schema: <http://schema.org/>

          ASK { 
            ?s schema:name "${offer.name}" .
            ?s schema:offeredBy <http://red-tape-reviewer.com/offices/${office.id}> .
          }
        `;

        const offerNameExistsQueryResult = await db.graphs.sparql('application/sparql-results+json', offerNameExistsQuery).result();
        const offerCatalogItemUri = `${offerCatalogUri}-item`;
        const offerUri = `http://red-tape-reviewer.com/services/${office.id}-${offer.name.toLowerCase()}`;

        // if offer doesn't exist create an entirely new offer
        if (!offerNameExistsQueryResult.boolean) {
          const insertOfferQuery = `
            PREFIX schema: <http://schema.org/>
            PREFIX rdf: <https://www.w3.org/1999/02/22-rdf-syntax-ns#>

            INSERT DATA {
              <${offerCatalogUri}> schema:itemListElement <${offerCatalogItemUri}> .
              <${offerCatalogItemUri}> schema:item <${offerUri}> .
              <${offerUri}> rdf:type schema:Offer .
              <${offerUri}> schema:name "${offer.name}" .
              <${offerUri}> schema:offeredBy <http://red-tape-reviewer.com/offices/${office.id}> .
              ${offer.price ? `<${offerUri}> schema:price "${offer.price}" .` : ''}
              ${offer.description ? `<${offerUri}> schema:description "${offer.description}" .` : ''}
            }
          `;

          await db.graphs.sparqlUpdate(insertOfferQuery);
        } else { // if offer exists, update its properties
          if (offer.price) {
            const updateOfferQuery = `
              PREFIX schema: <http://schema.org/>

              INSERT { 
                <${offerUri}> schema:price "${offer.price}" .
              } 
              WHERE {
                FILTER NOT EXISTS { <${offerUri}> schema:price ?o } 
              }
            `;

            await db.graphs.sparqlUpdate(updateOfferQuery);
          }
          
          if (offer.description) {
            const updateOfferQuery = `
              PREFIX schema: <http://schema.org/>

              INSERT { 
                <${offerUri}> schema:description "${offer.description}" .
              } 
              WHERE {
                FILTER NOT EXISTS { <${offerUri}> schema:description ?o } 
              }
            `;

            await db.graphs.sparqlUpdate(updateOfferQuery);
          }
        }
      });
    }

    if (office.streetAddress) {
      const selectAddressComponentsQuery = `
        PREFIX schema: <http://schema.org/>

        SELECT ?addressRegion ?streetAddress WHERE {
          <http://red-tape-reviewer.com/addresses/${office.id}> schema:addressRegion ?addressRegion .

          OPTIONAL {
            <http://red-tape-reviewer.com/addresses/${office.id}> schema:streetAddress ?streetAddress .
          }
        }
      `;

      let existingAddress = {};

      const selectAddressComponentsQueryResult = await db.graphs.sparql('application/sparql-results+json', selectAddressComponentsQuery).result();

      if (!selectAddressComponentsQueryResult || !selectAddressComponentsQueryResult.results || !selectAddressComponentsQueryResult.results.bindings || !selectAddressComponentsQueryResult.results.bindings.length) {
        return { message: `something went wrong when fetching trying to update 'streetAddress' property for office with id ${office.id}` }
      } else {
        if (selectAddressComponentsQueryResult.results.bindings.length > 1) {
          return { message: `something went wrong when processing existing address results. Multiple bindings found`};
        }

        existingAddress = Object.entries(selectAddressComponentsQueryResult.results.bindings[0]).reduce((prevObj, [key, {value}]) => {
          if (!value) {
            return;
          }

          return {
            ...prevObj,
            [key]: value
          }
        }, {});

        if (existingAddress.streetAddress) {
          return { message: `office with id ${office.id} already has a 'streetAddress' present. 'streetAddress' update failed` }
        }

        const coordinates = await getCoordinates(`${office.streetAddress} ${existingAddress.addressRegion}`);
        
        let newAddress = {
          streetAddress: office.streetAddress
        };

        if (typeof coordinates.lng === 'number' && typeof coordinates.lat === 'number') {
          newAddress.lng = coordinates.lng;
          newAddress.lat = coordinates.lat;
        }

        const mapUri = `http://red-tape-reviewer.com/maps/${office.id}`;

        const insertNewAddressQuery = `
          PREFIX schema: <http://schema.org/>

          INSERT DATA {
            <http://red-tape-reviewer.com/addresses/${office.id}> schema:streetAddress "${newAddress.streetAddress}" .
            <http://red-tape-reviewer.com/offices/${office.id}> schema:longitude "${newAddress.lng}" .
            <http://red-tape-reviewer.com/offices/${office.id}> schema:latitude "${newAddress.lat}" .
            <http://red-tape-reviewer.com/offices/${office.id}> schema:hasMap <${mapUri}> .
            <${mapUri}> schema:archivedAt <http://red-tape-reviewer.netlify.app/map?lng=${newAddress.lng}&lat=${newAddress.lat}&key=${process.env.MAP_API_KEY}> .
            <${mapUri}> schema:copyrightHolder <https://dbpedia.org/resource/Mapbox> .
            <${mapUri}> schema:creator <https://dbpedia.org/resource/Mapbox> .
            <${mapUri}> schema:sdPublisher <http://red-tape-reviewer.com/resource/RedTapeReviewer> . 
          }
        `;

        await db.graphs.sparqlUpdate(insertNewAddressQuery);
      }
    }
  }

  static async postReview(userId, officeId, review) {
    const userExistsQuery = `
      PREFIX schema: <http://schema.org/>

      ASK { <http://red-tape-reviewer.com/people/${userId}> ?p ?o }
    `;

    const userExistsQueryResult = await db.graphs.sparql('application/sparql-results+json', userExistsQuery).result();

    if (!userExistsQueryResult.boolean) {
      return { message: `No user with id ${userId} found. Cancelling review` }
    }

    const officeExistsQuery = `
      PREFIX schema: <http://schema.org/>

      ASK { <http://red-tape-reviewer.com/offices/${officeId}> ?p ?o }
    `;

    const officeExistsQueryResult = await db.graphs.sparql('application/sparql-results+json', officeExistsQuery).result();

    if (!officeExistsQueryResult.boolean) {
      return { message: `No office with id ${officeId} found. Cancelling review` }
    }

    if (!review.reviewRating) {
      return { message: "Review must have a 'reviewRating: number' property" }
    }

    const officeReviewsUri = `http://red-tape-reviewer.com/reviews/${officeId}`;
    const officeReviewsItemUri = `${officeReviewsUri}-item`;
    const reviewUri = `${officeReviewsUri}/${crypto.randomUUID()}`;
    const officeUri = `http://red-tape-reviewer.com/offices/${officeId}`;
    const officeAggregateReviewUri = `http://red-tape-reviewer.com/aggregate-reviews/${officeId}`;
    const userUri = `http://red-tape-reviewer.com/people/${userId}`;

    // insert review
    const insertReviewQuery = `
      PREFIX schema: <http://schema.org/>
      PREFIX rdf: <https://www.w3.org/1999/02/22-rdf-syntax-ns#>

      INSERT DATA {
        <${reviewUri}> rdf:type schema:Review .
        <${reviewUri}> schema:reviewRating ${review.reviewRating} .
        ${review.reviewBody ? `<${reviewUri}> schema:reviewBody "${review.reviewBody}" .` : ''}
        ${review.reviewAspect ? `<${reviewUri}> schema:reviewAspect "${review.reviewAspect}" .` : ''}
        <${reviewUri}> schema:author <${userUri}> .
        <${reviewUri}> schema:itemReviewed <${officeUri}> .
      }
    `;

    await db.graphs.sparqlUpdate(insertReviewQuery);

    const aggregateRatingExistsQuery = `
      PREFIX schema: <http://schema.org/>

      ASK { <http://red-tape-reviewer.com/aggregate-reviews/${officeId}> ?p ?o }
    `;

    const aggregateRatingExistsQueryResult = await db.graphs.sparql('application/sparql-results+json', aggregateRatingExistsQuery).result();
    
    // TODO: aggregate review is not inserted for the first time. Don't know if it updates tho, didn't test. Fix this

    // if no reviews list for office, create it, and add the aggregateRating property
    if (!aggregateRatingExistsQueryResult.boolean) {
      console.log("Inserting first ever aggregate review");
      const insertReviewOfficeReviewsAggregateRating = `
        PREFIX schema: <http://schema.org/>
        PREFIX rdf: <https://www.w3.org/1999/02/22-rdf-syntax-ns#>

        INSERT DATA {
          <${officeUri}> schema:reviews <${officeReviewsUri}> .
          <${officeUri}> schema:aggregateRating <${officeAggregateReviewUri}> .
          <${officeAggregateReviewUri}> rdf:type schema:AggregateRating .
          <${officeAggregateReviewUri}> schema:reviewCount 1 .
          <${officeAggregateReviewUri}> schema:ratingValue ${review.reviewRating} .
          <${officeAggregateReviewUri}> schema:itemReviewed <${officeUri}> .
        }
      `;

      await db.graphs.sparqlUpdate(insertReviewOfficeReviewsAggregateRating);
    } else { // else, update the aggregateRating property
      console.log("existing aggregate rating, updating it");
      const allOfficeReviewsQuery = `
        PREFIX schema: <http://schema.org/>
        PREFIX rdf: <https://www.w3.org/1999/02/22-rdf-syntax-ns#>
        
        SELECT ?reviewRating WHERE {
          ?s rdf:type schema:Review .
          ?s schema:itemReviewed <${officeUri}> .
          
          ?s schema:reviewRating ?reviewRating .
        }
      `;

      const allOfficeReviewsQueryResult = await db.graphs.sparql('application/sparql-results+json', allOfficeReviewsQuery).result();

      const reviewsRatings = [review.reviewRating];

      if (allOfficeReviewsQueryResult && allOfficeReviewsQueryResult.results && allOfficeReviewsQueryResult.results.bindings && allOfficeReviewsQueryResult.results.bindings.length) {
        allOfficeReviewsQueryResult.results.bindings.forEach(review => {
          const reviewRating = Number(review.reviewRating.value);
          reviewsRatings.push(reviewRating);
        });
      }

      const reviewsRatingsTotal = reviewsRatings.reduce((prevRating, rating) => prevRating + rating, 0);

      const newAggregateRatingValue = Math.ceil(reviewsRatingsTotal / reviewsRatings.length);

      const existingAggregateRatingQuery = `
        PREFIX schema: <http://schema.org/>
        PREFIX rdf: <https://www.w3.org/1999/02/22-rdf-syntax-ns#>
        
        SELECT ?ratingValue ?reviewCount WHERE {
          ?s rdf:type schema:AggregateRating .
          ?s schema:itemReviewed <${officeUri}> .
          
          ?s schema:ratingValue ?ratingValue .
          ?s schema:reviewCount ?reviewCount .
        }
      `;

      const existingAggregateRatingQueryResult = await db.graphs.sparql('application/sparql-results+json', existingAggregateRatingQuery).result();

      let existingRatingValue;
      let existingReviewCount;

      if (existingAggregateRatingQueryResult && existingAggregateRatingQueryResult.results && existingAggregateRatingQueryResult.results.bindings && existingAggregateRatingQueryResult.results.bindings.length) {
        existingRatingValue = existingAggregateRatingQueryResult.results.bindings[0].ratingValue.value;
        existingReviewCount = existingAggregateRatingQueryResult.results.bindings[0].reviewCount.value;
      }

      // TODO: are the aggregate reviews properties added correctly?
      if (!existingRatingValue || !existingReviewCount) {
        return { message: 'Error when querying existing aggregate rating. Cancelling' };
      }

      const deleteExistingAggregateRatingValueCount = `
        PREFIX schema: <http://schema.org/>
        
        DELETE DATA {
          <${officeAggregateReviewUri}> schema:reviewCount ${Number(existingReviewCount)} .
          <${officeAggregateReviewUri}> schema:ratingValue ${Number(existingRatingValue)} .
        }
      `;

      await db.graphs.sparqlUpdate(deleteExistingAggregateRatingValueCount);

      const insertNewAggregateRatingValueCount = `
        PREFIX schema: <http://schema.org/>
          
        INSERT DATA {
          <${officeAggregateReviewUri}> schema:reviewCount ${Number(reviewsRatings.length)} .
          <${officeAggregateReviewUri}> schema:ratingValue ${Number(newAggregateRatingValue)} .
        }
      `;

      await db.graphs.sparqlUpdate(insertNewAggregateRatingValueCount);
    }

    // add review to office reviews list
    const addReviewToOfficeReviewsQuery = `
      PREFIX schema: <http://schema.org/>
    
      INSERT DATA {
        <${officeReviewsUri}> schema:itemListElement <${officeReviewsItemUri}> .
        <${officeReviewsItemUri}> schema:item <${reviewUri}> .
      }
    `;

    await db.graphs.sparqlUpdate(addReviewToOfficeReviewsQuery);
  }

  // TODO: create function for posting reviews, update selector function as well
}

// await Office.getOfficeById('aaneiandreea-ramonasuceavaitaliană32150suceava742364955');
// console.log(await Office.updateOffice({
//   id: 'aaneiandreea-ramonasuceavaitaliană32150suceava742364955',
//   // streetAddress: 'Strada 8 Martie',
//   // openingHours: 'Overriden from backend',
//   // telephone: 'new telephone from backend',
//   // addition and modification of offers possible
//   offerCatalog: [
//     {
//       name: 'Italiană',
//       price: '24.99',
//       description: 'Traducere si interpretare din si in Italiană'
//     },
//     {
//       name: 'English',
//       price: '29.00',
//       description: 'Translation and interpretation from and to English'
//     },
//     {
//       name: 'Chinese',
//       price: '50.00',
//       description: 'Translation and interpretation from and to Chinese'
//     }
//   ]
// }))
console.log(await Office.postReview(
  'test',
  'adamadriana-andreeabraşovozuncovasna',
  {
    reviewRating: 1,
    reviewBody: "Veryy nice",
    reviewAspect: "Simple..."
  }
));