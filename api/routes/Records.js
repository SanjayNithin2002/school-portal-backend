var mongoose = require('mongoose');
var express = require('express');
var multer = require('multer');
var admin = require("firebase-admin");
var Records = require('../models/Records');
var checkAuth = require('../middleware/checkAuth');
var makeUrlFriendly = require('../middleware/makeUrlFriendly');
var router = express.Router();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./records/");
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
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.client_x509_cert_url,
    universe_domain: "googleapis.com"
}
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.BUCKET_URL
}, 'records');

var bucket = admin.storage().bucket();

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