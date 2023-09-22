// Import the 'jsonwebtoken' library
var jwt = require("jsonwebtoken");

// Export a middleware function that handles JWT authentication
module.exports = (req, res, next) => {
    try {
        // Extract the JWT token from the 'Authorization' header
        var token = req.headers.authorization.split(" ");
        console.log(token[1]); // Log the extracted token (for debugging)

        // Verify and decode the JWT token using the provided JWT_KEY (secret key)
        var decoded = jwt.verify(token[1], process.env.JWT_KEY);

        // Attach the decoded user data to the request object for future use
        req.userData = decoded;

        // Continue processing the request by passing it to the next middleware or route handler
        next();
    } catch (err) {
        // Handle any errors that occur during JWT verification
        res.status(401).json({
            message: "Authentication Failed"
        });
    }
}
