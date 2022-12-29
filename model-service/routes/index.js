import Handlers from '../handlers.js';
import {transformOfficeObjectToJsonLd} from '../utils/index.js';

export const routes = {
  offices: async function(data, res) {
    if (data.method == 'get') {
      if (data.resourceId) {
        const thing = await Handlers.getThing(`http://red-tape-reviewer.com/offices/${data.resourceId}`);

        const payload = {
          thing: transformOfficeObjectToJsonLd(thing),
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
        const payload = await Handlers.getOfficeById(data.queryString.id);

        if (!payload) {
          const payloadMessage = {
            message: `No entity found with [id]: ${data.queryString.id}`,
            code: 200
          }
          const payloadStr = JSON.stringify(payloadMessage);
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


      if (Object.keys(data.queryString).length === 1 && data.queryString.page) {
        const payload = await Handlers.getOfficesPaginated(data.queryString.page);

        if (!payload) {
          const payloadMessage = {
            message: "No entities found",
            code: 404
          };
          const payloadStr = JSON.stringify(payloadMessage);
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.writeHead(404);

          res.write(payloadStr);
          res.end("\n");

          return;
        } 

        const jsonldPayload = payload.map(office => {
          return transformOfficeObjectToJsonLd(office);
        })

        const payloadStr = JSON.stringify(jsonldPayload);
        res.setHeader("Content-Type", "application/ld+json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.writeHead(200);

        res.write(payloadStr);
        res.end("\n");

        return;
      }

      if (Object.keys(data.queryString).length > 1) {
        const filters = {
          ...data.queryString ? {name: data.queryString.name} : {},
          ...data.queryString ? {addressRegion: data.queryString.addressRegion} : {},
          ...data.queryString ? {streetAddress: data.queryString.streetAddress} : {},
          ...data.queryString ? {type: data.queryString.type} : {},
          ...data.queryString ? {reviewCount: Number(data.queryString.reviewCount)} : {},
          ...data.queryString ? {ratingValue: Number(data.queryString.ratingValue)} : {},
          ...data.queryString ? {page: Number(data.queryString.page)} : {},
        }

        if (Object.values(filters).length === 0) {
          const payloadMessage = {
            message: "No relevant parameters found. If you want to filter try ?name: string, ?addressRegion: string, ?streetAddress: string, ?type: string, ?reviewCount: number, ?ratingValue: number, ?page: number.",
            code: 400
          };
          const payloadStr = JSON.stringify(payloadMessage);
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.writeHead(400);

          res.write(payloadStr);
          res.end("\n");

          return;
        }

        const payload = await Handlers.getOfficesFiltered(filters);
       
        const jsonldPayload = payload.map(office => {
          return transformOfficeObjectToJsonLd(office);
        })

        const payloadStr = JSON.stringify(jsonldPayload);
        res.setHeader("Content-Type", "application/ld+json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.writeHead(200);

        res.write(payloadStr);
        res.end("\n");

        return;
      }
    } else if (data.method == 'put') {
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

      const updatePayload = {
        id: data.requestPayload['@id'],
        ...data.requestPayload.streetAddress ? {streetAddress: data.requestPayload.streetAddress} : {},
        ...data.requestPayload.openingHours ? {openingHours: data.requestPayload.openingHours} : {},
        ...data.requestPayload.telephone ? {telephone: data.requestPayload.telephone} : {}
      }

      if (data.requestPayload.hasOfferCatalog) {
        updatePayload.offerCatalog = [];

        data.requestPayload.hasOfferCatalog.itemListElement.forEach(item => {
          updatePayload.offerCatalog.push({
            name: item.name,
            ...item.price ? {price: item.price} : {},
            ...item.description ? {description: item.description} : {}
          });
        })
      }

      const response = await Handlers.updateOffice(updatePayload);

      if (response?.message) {
        const payload = {
          message: response.message,
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
  reviews: async function(data, res) {
    if (data.method == 'post') {
      if (!data.requestPayload['itemReviewed'] || !data.requestPayload['author'] || !data.requestPayload['reviewRating']) {
        const payload = {
          message: "Request body must have at least: [itemReviewed], [author] and [reviewRating] fields",
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

      const userId = data.requestPayload.author.slice(data.requestPayload.author.lastIndexOf('/') + 1);
      const officeId = data.requestPayload.itemReviewed.slice(data.requestPayload.itemReviewed.lastIndexOf('/') + 1);
      const reviewBody = {
        reviewRating: data.requestPayload.reviewRating,
        ...data.requestPayload.reviewBody ? {reviewBody: data.requestPayload.reviewBody} : {},
        ...data.requestPayload.reviewAspect ? {reviewAspect: data.requestPayload.reviewAspect} : {}
      };

      const response = await Handlers.postReview(userId, officeId, reviewBody);

      if (response?.message) {
        const payload = {
          message: response.message,
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
        message: "Reviewed successfully",
        code: 200
      };
      const payloadStr = JSON.stringify(payload);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.writeHead(200);

      res.write(payloadStr);
      res.end("\n");

      return;
    } else if (data.method == 'get' && data.resourceId) {
      const thing = await Handlers.getThing(`http://red-tape-reviewer.com/reviews/${data.resourceId}`);

      const payload = {
        thing,
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
  addresses: async function(data, res) {
    if (data.method == 'get' && data.resourceId) {
      const thing = await Handlers.getThing(`http://red-tape-reviewer.com/addresses/${data.resourceId}`);

      const payload = {
        thing,
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
  maps: async function(data, res) {
    if (data.method == 'get' && data.resourceId) {
      const thing = await Handlers.getThing(`http://red-tape-reviewer.com/maps/${data.resourceId}`);

      const payload = {
        thing,
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
  offers: async function(data, res) {
    if (data.method == 'get' && data.resourceId) {
      const thing = await Handlers.getThing(`http://red-tape-reviewer.com/offers/${data.resourceId}`);

      const payload = {
        thing,
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
  services: async function(data, res) {
    if (data.method == 'get' && data.resourceId) {
      const thing = await Handlers.getThing(`http://red-tape-reviewer.com/services/${data.resourceId}`);

      const payload = {
        thing,
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
  "aggregate-reviews": async function(data, res) {
    if (data.method == 'get' && data.resourceId) {
      const thing = await Handlers.getThing(`http://red-tape-reviewer.com/aggregate-reviews/${data.resourceId}`);

      const payload = {
        thing,
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
  resource: async function(data, res) {
    if (data.method == 'get' && data.resourceId) {
      const thing = await Handlers.getThing(`http://red-tape-reviewer.com/resource/${data.resourceId}`);

      const payload = {
        thing,
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
  sparql: async function(data, res) {
    if (data.method == 'get') {
      if (!data.queryString['default-graph-uri'] || data.queryString['default-graph-uri'] !== 'http://red-tape-reviewer.com') {
        const payload = {
          message: "Must specify [default-graph-uri] parameter. Existing graphs: [http://red-tape-reviewer.com]",
          code: 400
        };
        const payloadStr = JSON.stringify(payload);
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.writeHead(400);
    
        res.write(payloadStr);
        res.end("\n");
    
        return;
      }

      if (!data.queryString.query) {
        const payload = {
          message: "Must specify [query] parameter",
          code: 400
        };
        const payloadStr = JSON.stringify(payload);
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.writeHead(400);
    
        res.write(payloadStr);
        res.end("\n");
    
        return;
      }

      const result = await Handlers.arbitraryQuery(data.queryString.query);

      const payload = {
        result,
        code: 200
      };
      const payloadStr = JSON.stringify(payload);
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.writeHead(200);
  
      res.write(payloadStr);
      res.end("\n");
  
      return;
    }

    const payload = {
      message: "Only GET requests are allowed for this SPARQL endpoint",
      code: 400
    };
    const payloadStr = JSON.stringify(payload);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.writeHead(400);

    res.write(payloadStr);
    res.end("\n");

    return;
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