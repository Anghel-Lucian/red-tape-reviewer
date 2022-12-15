import util from 'util';

export function transformOfficeObjectToJsonLd(object) {
  let defaultJson = {
    "@context": "https://schema.org/",
    "@type": object.Type === 'Notary' ? 'Notary' : 'LocalBusiness',
    "@id": `http://red-tape-reviewer.com/office?id=${object.OfficeId}`,
    // "name": "Felix Translator",
    "address": {
      "@type": "PostalAddress",
    //   "addressRegion": "Botosani",
    //   "streetAddress": "Calea Notarilor, Nr. 23"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      // "ratingValue": "5",
      // "ratingCount": "1"
    },
    "reviews": {
      "@type": "ItemList",
      "itemListElement": [
        // {
          // "@type": "Review",
          // "reviewRating": "5",
          // "reviewAspect": "Title title",
          // "reviewBody": "Comment of review",
          // "creator": {
          //   "@type": "Person",
          //   "@id": "http://red-tape-reviewer.com/user-1"
          // }
        // }
      ]
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": object.Type === 'Notary' ? 'Legal Services' : 'Translated/Interpreted Languages',
      "itemListElement": [
        // {
        //   "@type": "Offer",
        //   "itemOffered": {
        //     "@type": "Service",
        //     "name": "English",
        //     "price": "25.99",
        //     "priceCurrency": "RON"
        //   }
        // }
      ]
    },
    // "openingHours": 
      // "value": "Mo-Su 10am-9pm"
    // "telephone": 
    // "0234123579"
    
  }

  if (object.Name || object.FirstName) {
    defaultJson.name = object.Name || object.FirstName;
  }

  if (object.FirstName) {
    defaultJson.name = `${defaultJson.name} ${object.FirstName}`;
  }

  if (object.County) {
    defaultJson.address.addressRegion = object.County;
  }

  if (object.City) {
    defaultJson.address.addressRegion = object.City;
  }

  if (object.Address) {
    defaultJson.address.streetAddress = object.Address;
  }

  if (object.Reviews) {
    console.log("do something with the reviews");
    // TODO: see how you'll implement reviews in all of this, also aggregate review
  }

  if (object.Services) {
    console.log("do something with the services");
    // TODO: see how you'll implement services
  }

  if (object.Languages) {
    const languagesArray = object.Languages.split(", ");

    languagesArray.forEach(language => {
      defaultJson.hasOfferCatalog.itemListElement.push({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": language
        }
      });
    });
  }

  if (object.Timetable) {
    defaultJson.openingHours = object.Timetable;
  }

  if (object.Contacts) {
    defaultJson.telephone = object.Contacts;
  }

  return defaultJson;
}

export function transformJsonLdToOfficeObject(object) {
  
}

export const safePromisify = function (fun, methodsArray) {
  const suffix = 'Async';
    methodsArray.forEach(method => {
      fun[method + suffix] = util.promisify(fun[method]);
  });
}