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
    const route = typeof routes[path] !== "undefined" ? routes[path] : routes["notFound"];
    const data = {
      path,
      queryString,
      headers,
      method,
      requestPayload: payload
    };

    route(data, res);
  });
});

server.listen(3000, function() {
  console.log("Listening on port 3000");
});