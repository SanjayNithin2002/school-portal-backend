var mongoose = require('mongoose');
var express = require('express');
var multer = require('multer');
var admin = require("firebase-admin");
var Bonafides = require('../models/Bonafides');
var checkAuth = require('../middleware/checkAuth');
var router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./bonafides/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname)

    }
});

const fileFilter = (req, file, cb) => {
    //accept
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    }
    //reject
    else {
        cb(null, false);
    }
}

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});

const serviceAccount = {
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
                    requestedFile: doc.requestedFile !== null ? "https://schoolportalbackend.onrender.com/downloadfile/" + doc.requestedFile.split("\\").join("/") : null,
                }
            });
            res.status(200).json({
                bonafides: bonafides
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
                bonafide: {
                    _id: doc._id,
                    student: doc.student,
                    service: doc.service,
                    [doc.service]: doc[doc.service],
                    requestedFile: doc.requestedFile !== null ? "https://schoolportalbackend.onrender.com/downloadfile/" + doc.requestedFile.split("\\").join("/") : null,
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
                    requestedFile: doc.requestedFile !== null ? "https://schoolportalbackend.onrender.com/downloadfile/" + doc.requestedFile.split("\\").join("/") : null,
                }
            });
            res.status(200).json({
                bonafides: bonafides
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
            description: (req.body.passport !== undefined) ? req.body.passport.description : "NA"
        },
        visa: {
            fromDate: (req.body.visa !== undefined) ? req.body.visa.fromDate : "NA",
            toDate: (req.body.visa !== undefined) ? req.body.visa.toDate : "NA",
            place: (req.body.visa !== undefined) ? req.body.visa.place :  "NA",
            description: (req.body.visa !== undefined) ? req.body.visa.description : "NA"
        },
        buspass: {
            description: (req.body.buspass !== undefined) ? req.body.buspass.description : "NA"
        },
        incomeTax: {
            description: (req.body.incomeTax !== undefined) ? req.body.incomeTax.description : "NA",
            employee: (req.body.incomeTax !== undefined) ? req.body.incomeTax.employee : "NA"
        },
        NCCBonafide: {
            description: (req.body.NCCBonafide !== undefined) ? req.body.NCCBonafide.description : "NA"
        },
        tc: {
            description: (req.body.tc !== undefined) ? req.body.TC.description : "NA"
        },
        requestedFile: null
    });
    bonafide.save()
        .then(doc => {
            res.status(201).json({
                message: "Bonafide Requested Successfully",
                bonafide: doc
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});



router.patch("/:id", checkAuth, upload.single("bonafide"), (req, res) => {
    Bonafides.findByIdAndUpdate(req.params.id, {
        $set: {
            requestedFile: req.file.path
        }
    }).exec()
        .then(doc => {
            bucket.upload(req.file.path, {
                destination: 'bonafides/' + req.file.filename,
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
                        doc: doc
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