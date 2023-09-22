var mongoose = require('mongoose');
var express = require('express');
var multer = require('multer');
var admin = require("firebase-admin");
var Bonafides = require('../models/Bonafides');
var checkAuth = require('../middleware/checkAuth');
var makeUrlFriendly = require('../middleware/makeUrlFriendly');
var router = express.Router();

/* The code `var storage = multer.diskStorage({ ... })` is creating a storage engine for Multer, a
middleware for handling file uploads in Node.js. */
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./bonafides/");
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

/* The `serviceAccount` object is used to configure the credentials for accessing the Firebase Admin
SDK. It contains various properties that are required for authentication and authorization purposes
when interacting with Firebase services. */
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

/* The `admin.initializeApp()` function is used to initialize the Firebase Admin SDK. It takes an
object as an argument with two properties: */
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.BUCKET_URL
}, "bonafides");

/* `var bucket = admin.storage().bucket();` is creating a reference to the default storage bucket in
Firebase Storage. This allows you to perform various operations on the bucket, such as uploading
files, downloading files, deleting files, etc. */
var bucket = admin.storage().bucket();

/* The code `router.get("/", checkAuth, (req, res) => { ... })` is defining a route for handling GET
requests to the root URL ("/"). */
router.get("/", checkAuth, (req, res) => {
    Bonafides.find().populate("student").exec()
        .then(docs => {
            var bonafides = docs.map(doc => {
                return {
                    _id: doc._id,
                    student: doc.student,
                    service: doc.service,
                    [doc.service]: doc[doc.service],
                    requestedFile: doc.requestedFile !== null ? process.env.url + "/downloadfile/" + doc.requestedFile.split("\\").join("/") : null,
                    postedOn: doc.postedOn,
                    status: doc.status,
                    message: doc.message
                }
            });
            res.status(200).json({
                docs: bonafides
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The code `router.get("/:id", checkAuth, (req, res) => { ... })` is defining a route for handling GET
requests to the URL "/:id", where ":id" is a dynamic parameter that represents the ID of a specific
bonafide request. */
router.get("/:id", checkAuth, (req, res) => {
    Bonafides.findById(req.params.id).populate("student").exec()
        .then(doc => {
            res.status(200).json({
                docs: {
                    _id: doc._id,
                    student: doc.student,
                    service: doc.service,
                    [doc.service]: doc[doc.service],
                    requestedFile: doc.requestedFile !== null ? process.env.url + "/downloadfile/" + doc.requestedFile.split("\\").join("/") : null,
                    postedOn: doc.postedOn,
                    status: doc.status,
                    message: doc.message
                }
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The code `router.get("/students/:studentID", checkAuth, (req, res) => { ... })` is defining a route
for handling GET requests to the URL "/students/:studentID", where ":studentID" is a dynamic
parameter that represents the ID of a specific student. */
router.get("/students/:studentID", checkAuth, (req, res) => {
    Bonafides.find({ student: req.params.studentID }).populate("student").exec()
        .then(docs => {
            var bonafides = docs.map(doc => {
                return {
                    _id: doc._id,
                    student: doc.student,
                    service: doc.service,
                    [doc.service]: doc[doc.service],
                    requestedFile: doc.requestedFile !== null ? process.env.url + "/downloadfile/" + doc.requestedFile.split("\\").join("/") : null,
                    postedOn: doc.postedOn,
                    status: doc.status,
                    message: doc.message
                }
            });
            res.status(200).json({
                docs: bonafides
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The code `router.post("/", checkAuth, (req, res) => { ... })` is defining a route for handling POST
requests to the root URL ("/"). */
router.post("/", checkAuth, (req, res) => {
    var bonafide = new Bonafides({
        _id: new mongoose.Types.ObjectId(),
        service: req.body.service,
        //check bonafide models 
        student: req.body.student,
        passport: {
            description: (req.body.passport) ? req.body.passport.description : "NA"
        },
        visa: {
            fromDate: (req.body.visa) ? req.body.visa.fromDate : "NA",
            toDate: (req.body.visa) ? req.body.visa.toDate : "NA",
            place: (req.body.visa) ? req.body.visa.place : "NA",
            description: (req.body.visa) ? req.body.visa.description : "NA"
        },
        buspass: {
            description: (req.body.buspass) ? req.body.buspass.description : "NA"
        },
        incomeTax: {
            description: (req.body.incomeTax) ? req.body.incomeTax.description : "NA",
            employee: (req.body.incomeTax) ? req.body.incomeTax.employee : "NA"
        },
        NCCBonafide: {
            description: (req.body.NCCBonafide) ? req.body.NCCBonafide.description : "NA"
        },
        tc: {
            description: (req.body.tc) ? req.body.TC.description : "NA"
        },
        requestedFile: null,
        postedOn: new Date().toJSON()
    });
    bonafide.save()
        .then(doc => {
            res.status(201).json({
                message: "Bonafide Requested Successfully",
                docs: doc
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The code `router.patch("/:id", checkAuth, upload.single("bonafide"), (req, res) => { ... })` is
defining a route for handling PATCH requests to the URL "/:id", where ":id" is a dynamic parameter
that represents the ID of a specific bonafide request. */
router.patch("/:id", checkAuth, upload.single("bonafide"), (req, res) => {
    updateOps = {
        requestedFile: req.file ? 'bonafides/' + makeUrlFriendly(req.file.filename) : null,
        status: req.body.status,
        message: req.body.message
    }
    Bonafides.findByIdAndUpdate(req.params.id, { $set: updateOps }).exec()
        .then(doc => {
            if (doc.requestedFile !== null) {
                bucket.upload(req.file.path, {
                    destination: 'bonafides/' + makeUrlFriendly(req.file.filename),
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
                            message: "Bonafide Uploaded Successfully",
                            docs: doc
                        });
                    }
                }
                )
            } else {
                res.status(201).json({
                    message: "Bonafide Updated Successfully",
                    docs: doc
                });
            }
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The code `router.delete("/:id", checkAuth, (req, res) => { ... })` is defining a route for handling
DELETE requests to the URL "/:id", where ":id" is a dynamic parameter that represents the ID of a
specific bonafide request. */
router.delete("/:id", checkAuth, (req, res) => {
    Bonafides.findByIdAndDelete(req.params.id).exec()
        .then(doc => {
            res.status(200).json({
                message: "Bonafide Request Deleted Successfully"
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

module.exports = router;