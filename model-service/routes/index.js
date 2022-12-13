const postOffice = (data, res) => {
  console.log(data);  

  return 200;
}

export const routes = {
  office: function(data, res) {
    const httpCode = postOffice(data, res);

    res.setHeader("Content-Type", "application/rdf+xml");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.writeHead(httpCode);
    res.end("\n");
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