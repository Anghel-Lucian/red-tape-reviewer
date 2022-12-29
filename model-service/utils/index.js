import util from 'util';
import axios from 'axios';

export function transformOfficeObjectToJsonLd(object) {
  let defaultJson = {
    "@context": "http://schema.org/",
    "@type": object.type === '<http://schema.org/Notary>' ? 'Notary' : 'LocalBusiness',
    "@id": object.id,
    "name": object.name,
    "address": {
      "@type": "PostalAddress",
      "addressRegion": object.addressRegion,
      ...object.streetAddress ? {"streetAddress": object.streetAddress} : {}
    },
    ...object.aggregateRating ? {"aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": object.aggregateRating.ratingValue,
      "reviewCount": object.aggregateRating.reviewCount
    }} : {},
    ...object.reviews ? {"reviews": {
      "@type": "ItemList",
      "itemListElement": []
    }} : {},
    ...object.offerCatalog ? {"hasOfferCatalog": {
      "@type": "OfferCatalog",
      "itemListElement": []
    }} : {},
    ...object.openingHours ? {"openingHours": object.openingHours} : {},
    ...object.telephone ? {"telephone": object.telephone} : {}
  }

  if (object.reviews) {
    object.reviews.forEach(review => {
      defaultJson.reviews.itemListElement.push({
        "@type": "Review",
        "author": review.author,
        ...review.reviewBody ? {"reviewBody": review.reviewBody} : {},
        ...review.reviewAspect ? {"reviewAspect": review.reviewAspect} : {},
        "reviewRating": review.reviewRating
      });
    });
  }

  if (object.offerCatalog) {
    object.offerCatalog.forEach(offer => {
      defaultJson.hasOfferCatalog.itemListElement.push({
        "@type": "Offer",
        "name": offer.name,
        ...offer.description ? {"description": offer.description} : {}
      });
    })
  }

  return defaultJson;
}

export const safePromisify = function (fun, methodsArray) {
  const suffix = 'Async';
    methodsArray.forEach(method => {
      fun[method + suffix] = util.promisify(fun[method]);
  });
}

export async function getCoordinates(address) {
  const url = 'https://api.mapbox.com/geocoding/v5/mapbox.places/'
  + encodeURIComponent(address) + '.json?access_token='
  + process.env.MAP_API_KEY + '&limit=1';
  const axiosOptions = {
    url,
    method: 'GET',
    headers: {}
  }
  const {data} = await axios(axiosOptions);

  if (data?.message || !data.features?.length || !data.features[0].center?.length) {
    console.log(data);
    return;
  }

  return {
    lng: data.features[0].center[0],
    lat: data.features[0].center[1]
  }
}