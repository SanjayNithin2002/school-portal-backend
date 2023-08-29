var mongoose = require('mongoose');
var express = require('express');
var multer = require('multer');
var admin = require("firebase-admin");
var Bonafides = require('../models/Bonafides');
var checkAuth = require('../middleware/checkAuth');
var makeUrlFriendly = require('../middleware/makeUrlFriendly');
var router = express.Router();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./bonafides/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname)

    }
});

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

var upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});

var serviceAccount = {
    type: process.env.type,
    project_id: process.env.project_id,
    private_key_id: process.env.private_key_id,
    private_key: process.env.private_key.replace(/\\n/g, '\n'),
    client_email: process.env.client_email,
    client_id: process.env.client_id,
    auth_uri: process.env.auth_uri,
    token_uri: process.env.token_uri,
    auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
    client_x509_cert_url: process.env.client_x509_cert_url,
    universe_domain: process.env.universe_domain
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.BUCKET_URL
}, "bonafides");

var bucket = admin.storage().bucket();

router.get("/", checkAuth, (req, res) => {
    Bonafides.find().exec()
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

router.post("/", checkAuth, (req, res) => {
    var bonafide = new Bonafides({
        _id: new mongoose.Types.ObjectId(),
        service: req.body.service,
        // check bonafide models 
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
        postedOn: new Date().toJSON().slice(0, 10)
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