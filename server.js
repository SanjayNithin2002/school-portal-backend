// Import the 'http' module for creating an HTTP server
var http = require("http");

// Import the 'app' module, which likely contains your Express.js application
var app = require("./app");

// Define the port to listen on, using the value from the environment variable 'PORT' if available, otherwise default to 3000
var port = process.env.PORT || 3000;

// Create an HTTP server using the 'app' (Express.js) as the request handler
var server = http.createServer(app);

// Start the server and make it listen on the specified port
server.listen(port);


