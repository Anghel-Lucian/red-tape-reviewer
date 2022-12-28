import http from 'http';
import url from 'url';
import {routes} from './routes/index.js';

const server = http.createServer(function(req, res) {
  const parsedURL = url.parse(req.url, true);
  const path = parsedURL.pathname.replace(/^\/+|\/+$/g, "");

  const queryString = parsedURL.query;
  const headers = req.headers;
  const method = req.method.toLowerCase();
  const resBuffer = [];

  req.on("data", async (data) => {
    resBuffer.push(data);
    console.log(`[REQUEST WITH DATA RECEIVED: ${path} | ${method}]`);
  });

  req.on("end", function() {
    let payload;

    if (resBuffer.length > 0) {
      payload = JSON.parse(Buffer.concat(resBuffer).toString());
    }

    console.log(`[SENDING RESPONSE: ${path} | ${method}]`);
    let route = routes["notFound"];
    let resourceIdParam;

    if (typeof routes[path] !== "undefined") {
      route = routes[path];
    } else {
      let firstPath = path.slice(0, path.lastIndexOf("/"));
      let resourceId = path.slice(path.lastIndexOf("/") + 1);

      if (firstPath.includes("/")) {
        resourceId = firstPath.slice(firstPath.lastIndexOf("/") + 1) + "/" + resourceId;
        firstPath = firstPath.slice(0, firstPath.lastIndexOf("/"));
      }

      if (typeof routes[firstPath] !== "undefined") {
        route = routes[firstPath];
        resourceIdParam = decodeURI(resourceId);
      }
    }

    const data = {
      path,
      queryString,
      headers,
      method,
      requestPayload: payload,
      ...resourceIdParam ? {resourceId: resourceIdParam} : {}
    };

    route(data, res);
  });
});

server.listen(3000, function() {
  console.log("Listening on port 3000");
});