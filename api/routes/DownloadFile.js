var admin = require("firebase-admin");
var express = require('express');
var router = express.Router();
var checkAuth = require('../middleware/checkAuth');

/* The `serviceAccount` object is used to configure the Firebase Admin SDK with the necessary
credentials to access Firebase services. It contains various properties that are required for
authentication and authorization. */
var serviceAccount = {
    type: process.env.type,
    project_id: process.env.project_id,
    private_key_id: process.env.private_key_id,
    private_key: process.env.private_key.replace(/\\n/g, '\n'),
    client_email: process.env.client_email,
    client_id: process.env.client_id,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.client_x509_cert_url,
    universe_domain: "googleapis.com"
}

/* The `admin.initializeApp()` function is used to initialize the Firebase Admin SDK with the necessary
credentials and configuration. */
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.BUCKET_URL
}, "downloadFile");

/* `var bucket = admin.storage().bucket();` is creating a reference to the default Cloud Storage bucket
associated with the Firebase project. This allows you to perform various operations on the bucket,
such as uploading files, downloading files, deleting files, etc. */
var bucket = admin.storage().bucket();

/* The code block you provided is defining a route handler for a GET request to a specific URL pattern. */
router.get("/:location/:filename", checkAuth, (req, res) => {
    var location = req.params.location;
    var filename = req.params.filename;
    var filepath = location + "/" + filename;
    var file = bucket.file(filepath);
    var options = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7 // one week
    };
    file.getSignedUrl(options)
        .then(url => {
            res.status(200).json({
                url: url
            });
        }
        ).catch(err => {
            res.status(500).json({
                error: err
            });
        }
        );
});

module.exports = router;