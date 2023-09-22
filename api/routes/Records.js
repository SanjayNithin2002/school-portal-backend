var mongoose = require('mongoose');
var express = require('express');
var multer = require('multer');
var admin = require("firebase-admin");
var Records = require('../models/Records');
var checkAuth = require('../middleware/checkAuth');
var makeUrlFriendly = require('../middleware/makeUrlFriendly');
var router = express.Router();


/* The code `var storage = multer.diskStorage({ ... })` is creating a storage engine for Multer, a
middleware for handling file uploads in Node.js. */
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./records/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname)

    }
});

/* The `fileFilter` function is a callback function used by Multer to determine whether to accept or
reject a file during the file upload process. */
var fileFilter = (req, file, cb) => {
    //accept
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    }
    //reject
    else {
        cb(null, false);
    }
}

/* The code `var upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 10 },
fileFilter: fileFilter });` is creating an instance of Multer middleware with the specified options. */
var upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});

/* The `serviceAccount` object is used to configure the credentials for accessing the Firebase
services. It contains various properties that are required for authentication and authorization
purposes. These properties include: */
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

/* The `admin.initializeApp()` function is used to initialize the Firebase Admin SDK with the provided
configuration options. */
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.BUCKET_URL
}, 'records');

/* `var bucket = admin.storage().bucket();` is creating a reference to the default storage bucket in
Firebase Storage. This allows you to perform various operations on the bucket, such as uploading
files, deleting files, and retrieving file metadata. */
var bucket = admin.storage().bucket();

/* This code is defining a GET route for the root URL ("/") of the router. When a GET request is made
to this URL, the `checkAuth` middleware function is first executed to check if the user is
authenticated. If the user is authenticated, the code inside the route handler function is executed. */
router.get("/", checkAuth, (req, res) => {
    Records.find().exec()
        .then(docs => {
            var records = docs.map(doc => {
                return {
                    _id: doc._id,
                    title : doc.title,
                    date : doc.date,
                    document: process.env.url + "/downloadfile/" + doc.document.split("\\").join("/"),
                    class: doc.class
                }
            });
            res.status(200).json({
                docs: records
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* This code is defining a GET route for the URL "/:id" of the router. When a GET request is made to
this URL, the `checkAuth` middleware function is first executed to check if the user is
authenticated. If the user is authenticated, the code inside the route handler function is executed. */
router.get("/:id", checkAuth, (req, res) => {
    Records.findById(req.params.id).exec()
        .then(doc => {
            res.status(200).json({
                docs: {
                    _id: doc._id,
                    title : doc.title,
                    date : doc.date,
                    document: process.env.url + "/downloadfile/" + doc.document.split("\\").join("/"),
                    class: doc.class
                }
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* This code is defining a POST route for the root URL ("/") of the router. When a POST request is made
to this URL, the `checkAuth` middleware function is first executed to check if the user is
authenticated. If the user is authenticated, the code inside the route handler function is executed. */
router.post("/", checkAuth, upload.single('document'), (req, res) => {
    var record = new Records({
        _id: new mongoose.Types.ObjectId(),
        date : req.body.date,
        title : req.body.title,
        document : 'records/' + makeUrlFriendly(req.file.filename)
    });
    record.save()
        .then(doc => {
            bucket.upload(req.file.path, {
                destination: 'records/' + makeUrlFriendly(req.file.filename),
                metadata: {
                    contentType: req.file.mimetype
                }
            }, (err, file) => {
                if (err) {
                    res.status(500).json({
                        error: err
                    });
                }
                else {
                    res.status(201).json({
                        message: "Records Uploaded Successfully",
                        docs: doc
                    });
                }
            }
            );
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The `router.patch("/document/:id", checkAuth, upload.single('document'), (req, res) => { ... })`
code is defining a PATCH route for the URL "/document/:id" of the router. */
router.patch("/document/:id", checkAuth, upload.single('document'), (req, res) => {
    var id = req.params.id;
    Records.findById(id)
        .exec()
        .then(record => {
            if (!record) {
                return res.status(404).json({
                    message: "Record not found",
                });
            }
            var oldFilePath = record.document;
            var oldFile = bucket.file(oldFilePath);

            oldFile.delete()
                .then(() => {
                    var newFilePath = 'records/' + makeUrlFriendly(req.file.filename);
                    var newFile = bucket.file(newFilePath);

                    newFile.save(req.file.buffer, {
                        metadata: {
                            contentType: req.file.mimetype,
                        },
                    })
                        .then(() => {
                            record.document = newFilePath;
                            return record.save();
                        })
                        .then(updatedRecord => {
                            res.status(200).json({
                                message: "Record Updated Successfully",
                                docs: updatedRecord
                            });
                        })
                        .catch(err => {
                            res.status(500).json({
                                error: "Error uploading new file to Firebase Storage: " + err.message,
                            });
                        });
                })
                .catch(err => {
                    res.status(500).json({
                        error: "Error deleting old file from Firebase Storage: " + err.message,
                    });
                });
        })
        .catch(err => {
            res.status(500).json({
                error: err.message,
            });
        });
});


/* The code `router.patch("/:id", checkAuth, (req, res) => { ... })` is defining a PATCH route for the
URL "/:id" of the router. When a PATCH request is made to this URL, the `checkAuth` middleware
function is first executed to check if the user is authenticated. If the user is authenticated, the
code inside the route handler function is executed. */
router.patch("/:id", checkAuth, (req, res) => {
    var updateOps = {};
    for (var ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Records.findByIdAndUpdate(req.params.id, { $set: updateOps }).exec()
        .then(doc => {
            res.status(201).json({
                message: "Records Updated Successfully",
                docs: doc
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The `router.delete("/:id", checkAuth, (req, res) => { ... })` code is defining a DELETE route for
the URL "/:id" of the router. When a DELETE request is made to this URL, the `checkAuth` middleware
function is first executed to check if the user is authenticated. If the user is authenticated, the
code inside the route handler function is executed. */
router.delete("/:id", checkAuth, (req, res) => {
    var recordId = req.params.id;

    Records.findById(recordId)
        .exec()
        .then(record => {
            if (!record) {
                return res.status(404).json({
                    message: "Record not found",
                });
            }
            var filePath = record.document;
            var file = bucket.file(filePath);

            file.delete()
                .then(() => {
                    return Records.findByIdAndDelete(recordId).exec();
                })
                .then(() => {
                    res.status(200).json({
                        message: "Record and associated files deleted successfully",
                        docs: record,
                    });
                })
                .catch(err => {
                    res.status(500).json({
                        error: "Error deleting file from Firebase Storage: " + err.message,
                    });
                });
        })
        .catch(err => {
            res.status(500).json({
                error: err.message,
            });
        });
});

module.exports = router;