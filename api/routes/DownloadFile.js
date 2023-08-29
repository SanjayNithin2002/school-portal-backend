var admin = require("firebase-admin");
var express = require('express');
var router = express.Router();
var checkAuth = require('../middleware/checkAuth');

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

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.BUCKET_URL
}, "downloadFile");

var bucket = admin.storage().bucket();

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