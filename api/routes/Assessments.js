var mongoose = require('mongoose');
var express = require('express');
var multer = require('multer');
var admin = require("firebase-admin");
var Students = require('../models/Students');
var Assessments = require('../models/Assessments');
var Answers = require('../models/Answers');
var checkAuth = require('../middleware/checkAuth');
var router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./assessments/");
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
});

var bucket = admin.storage().bucket();

router.get("/", checkAuth, (req, res) => {
    Assessments.find().populate("class").exec()
        .then(docs => {
            var assessments = docs.map(doc => {
                return {
                    _id: doc._id,
                    maxMarks: doc.maxMarks,
                    weightageMarks: doc.weightageMarks,
                    postedOn: doc.postedOn,
                    lastDate: doc.lastDate,
                    title: doc.title,
                    description: doc.description,
                    questionPaper: "https://schoolportalbackend.onrender.com/downloadfile/" + doc.questionPaper.split("\\").join("/"),
                    class: doc.class
                }
            });
            res.status(200).json({
                assessments: assessments
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.get("/students/:studentID", checkAuth, (req, res) => {
    Students.findById(req.params.studentID).exec()
        .then(studDoc => {
            var standard = studDoc.standard;
            var section = studDoc.section;
            Assessments.find().populate('class').exec()
                .then(docs => {
                    var assessments = docs.filter(doc => doc.class ? doc.class.standard == standard && doc.class.section == section : false);
                    var assessments = assessments.map(doc => {
                        return {
                            _id: doc._id,
                            maxMarks: doc.maxMarks,
                            weightageMarks: doc.weightageMarks,
                            postedOn: doc.postedOn,
                            lastDate: doc.lastDate,
                            title: doc.title,
                            description: doc.description,
                            questionPaper: "https://schoolportalbackend.onrender.com//downloadfile/" + doc.questionPaper.split("\\").join("/"),
                            class: doc.class
                        }
                    })
                    res.status(200).json({
                        assessments: assessments
                    });
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.get("/teachers/:teacherID", (req, res) => {
    Assessments.find().populate('class').exec()
        .then(docs => {
            var assessments = docs.filter(doc => doc.class ? doc.class.teacher == req.params.teacherID : false);
            var assessments = assessments.map(doc => {
                return {
                    _id: doc._id,
                    maxMarks: doc.maxMarks,
                    weightageMarks: doc.weightageMarks,
                    postedOn: doc.postedOn,
                    lastDate: doc.lastDate,
                    title: doc.title,
                    description: doc.description,
                    questionPaper: "https://schoolportalbackend.onrender.com//downloadfile/" + doc.questionPaper.split("\\").join("/"),
                    class: doc.class
                }
            })
            res.status(200).json({
                assessments: assessments
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});


router.post("/", checkAuth, upload.single('questionPaper'), (req, res) => {
    var assessment = new Assessments({
        _id: new mongoose.Types.ObjectId(),
        maxMarks: req.body.maxMarks,
        weightageMarks: req.body.weightageMarks,
        postedOn: new Date().toJSON().slice(0, 10),
        lastDate: req.body.lastDate,
        title: req.body.title,
        description: req.body.description,
        questionPaper: req.file.path,
        class: req.body.class
    });
    assessment.save()
        .then(doc => {
            bucket.upload(req.file.path, {
                destination: 'assessments/' + req.file.filename,
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
                        message: "Assessment Uploaded Successfully",
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

router.patch("/questionPaper/:id", checkAuth, upload.single('questionPaper'), (req, res) => {
    Assessments.findByIdAndUpdate(req.params.id, { $set: { questionPaper: req.file.path } }).exec()
        .then(doc => {
            bucket.upload(req.file.path, {
                destination: 'assessments/' + req.file.filename,
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
                        message: "Assessment Updated Successfully",
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

router.patch("/:id", checkAuth, (req, res) => {
    var updateOps = {};
    for (const ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Assessments.findByIdAndUpdate(req.params.id, { $set: updateOps }).exec()
        .then(doc => {
            res.status(201).json({
                message: "Assessment Updated Successfully",
                doc: doc
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.delete("/:id", checkAuth, (req, res) => {
    Assessments.findByIdAndDelete(req.params.id).exec()
        .then(doc => {
            Answers.deleteMany({ assessment : req.params.id}, (error) => {
                if(err){
                    res.status(500).json({
                        error: err
                    })
                }else{
                    res.status(200).json({
                        message: "Assessment Deleted Successfully",
                        doc: doc
                    })
                }
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

module.exports = router;