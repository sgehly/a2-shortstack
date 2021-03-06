const http = require("http"),
  fs = require("fs"),
  fetch = require("node-fetch");
// IMPORTANT: you must run `npm install` in the directory for this assignment
// to install the mime library used in the following line of code
(mime = require("mime")), (dir = "public/"), (port = 3000);

const DATABASE = "https://jsonbox.io/box_eead4994d8163b499ae4";

const server = http.createServer(function (request, response) {
  if (request.method === "GET") {
    handleGet(request, response);
  } else if (request.method === "POST") {
    handlePost(request, response);
  }
});

const handleGet = function (request, response) {
  const filename = dir + request.url.slice(1);

  if (request.url === "/") {
    sendFile(response, "public/index.html");
  } else if (request.url == "/api/getData") {
    return fetch(DATABASE)
      .then((response) => response.text())
      .then((text) => {
        response.writeHead(200, "OK", { "Content-Type": "application/json" });
        response.write(text);
        response.end();
        return;
      });
  } else {
    sendFile(response, __dirname + "/" + filename);
  }
};

const handlePost = function (request, response) {
  let dataString = "";

  request.on("data", function (data) {
    dataString += data;
  });

  request.on("end", function () {
    const object = JSON.parse(dataString);

    let color = "transparent";
    if (object.task) {
      if (object.task.length > 10) {
        color = "#3498db";
      }
      if (object.task.length > 20) {
        color = "#d35400";
      }
      if (object.task.length > 30) {
        color = "#27ae60";
      }
      if (object.task.length > 40) {
        color = "#8e44ad";
      }
      if (object.task.length > 50) {
        color = "#c0392b";
      }

      object.color = color;
    }

    if (request.headers["x-forwarded-for"]) {
      object.ip = request.headers["x-forwarded-for"].split(",")[0];
    } else {
      object.ip = "N/A";
    }

    return fetch(DATABASE + (object.id ? "/" + object.id : ""), {
      method: object.id ? (object.delete ? "DELETE" : "PUT") : "POST",
      body: JSON.stringify(object),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((_) => {
        return fetch(DATABASE);
      })
      .then((response) => response.text())
      .then((text) => {
        response.writeHead(200, "OK", { "Content-Type": "application/json" });
        response.write(text);
        response.end();
      });
  });
};

const sendFile = function (response, filename) {
  const type = mime.getType(filename);

  fs.readFile(filename, function (err, content) {
    // if the error = null, then we've loaded the file successfully
    if (err === null) {
      // status code: https://httpstatuses.com
      response.writeHeader(200, { "Content-Type": type });
      response.end(content);
    } else {
      // file not found, error code 404
      response.writeHeader(404);
      response.end("404 Error: File Not Found");
    }
  });
};

server.listen(process.env.PORT || port);
