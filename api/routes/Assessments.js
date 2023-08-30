var mongoose = require('mongoose');
var express = require('express');
var multer = require('multer');
var admin = require("firebase-admin");
var Students = require('../models/Students');
var Assessments = require('../models/Assessments');
var Exams = require('../models/Exams');
var Answers = require('../models/Answers');
var checkAuth = require('../middleware/checkAuth');
var makeUrlFriendly = require('../middleware/makeUrlFriendly');
var timeToString = require('../middleware/timeToString');
var router = express.Router();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./assessments/");
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
}, "assessments");

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
                    questionPaper: process.env.url + "/downloadfile/" + doc.questionPaper.split("\\").join("/"),
                    class: doc.class
                }
            });
            res.status(200).json({
                docs: assessments
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
                            questionPaper: process.env.url + "/downloadfile/" + doc.questionPaper.split("\\").join("/"),
                            class: doc.class
                        }
                    })
                    res.status(200).json({
                        docs: assessments
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
                    questionPaper: process.env.url + "/downloadfile/" + doc.questionPaper.split("\\").join("/"),
                    class: doc.class
                }
            })
            res.status(200).json({
                docs: assessments
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.get('/exams/:teacherID', (req, res) => {
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
                    questionPaper: process.env.url + "/downloadfile/" + doc.questionPaper.split("\\").join("/"),
                    class: doc.class
                }
            });
            Exams.find().populate('class').exec()
                .then(docs => {
                    var docs = docs.filter(doc => doc.class ? doc.class.teacher == req.params.teacherID : false);
                    var exams = docs.map(doc => {
                        return {
                            _id: doc._id,
                            date: doc.date,
                            startTime: timeToString(doc.startTime),
                            endTime: timeToString(doc.endTime),
                            maxMarks: doc.maxMarks,
                            //weightageMarks: doc.weightageMarks,
                            examName: doc.examName.name + " - " + doc.examName.sequence,
                            subject: doc.class.subject,
                            standard: doc.class.standard,
                            section: doc.class.section
                        }
                    });
                    res.status(200).json({
                        docs: {
                            assessmentMarks: assessments,
                            examMarks: exams
                        }
                    });
                })
                .catch(err => {
                    res.status(500).json({
                        error: err,
                        seq : 1 
                    })
                });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
})


router.post("/", checkAuth, upload.single('questionPaper'), (req, res) => {
    var assessment = new Assessments({
        _id: new mongoose.Types.ObjectId(),
        maxMarks: req.body.maxMarks,
        weightageMarks: req.body.weightageMarks ? req.body.weightageMarks: req.body.maxMarks,
        postedOn: new Date().toJSON(),
        lastDate: req.body.lastDate,
        title: req.body.title,
        description: req.body.description,
        questionPaper: 'assessments/' + makeUrlFriendly(req.file.filename),
        class: req.body.class
    });
    assessment.save()
        .then(doc => {
            bucket.upload(req.file.path, {
                destination: 'assessments/' + makeUrlFriendly(req.file.filename),
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

router.patch("/questionPaper/:id", checkAuth, upload.single('questionPaper'), (req, res) => {
    var assessmentId = req.params.id;
    Assessments.findById(assessmentId)
        .exec()
        .then(assessment => {
            if (!assessment) {
                return res.status(404).json({
                    message: "Assessment not found",
                });
            }
            var oldFilePath = assessment.questionPaper;
            var oldFile = bucket.file(oldFilePath);

            oldFile.delete()
                .then(() => {
                    var newFilePath = 'assessments/' + makeUrlFriendly(req.file.filename);
                    var newFile = bucket.file(newFilePath);

                    newFile.save(req.file.buffer, {
                        metadata: {
                            contentType: req.file.mimetype,
                        },
                    })
                        .then(() => {
                            assessment.questionPaper = newFilePath;
                            return assessment.save();
                        })
                        .then(updatedAssessment => {
                            res.status(200).json({
                                message: "Assessment Updated Successfully",
                                docs: updatedAssessment
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
    Assessments.findByIdAndUpdate(req.params.id, { $set: updateOps }).exec()
        .then(doc => {
            res.status(201).json({
                message: "Assessment Updated Successfully",
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
    var assessmentId = req.params.id;

    // Find the assessment in the database
    Assessments.findById(assessmentId)
        .exec()
        .then(assessment => {
            if (!assessment) {
                return res.status(404).json({
                    message: "Assessment not found",
                });
            }
            var filePath = assessment.questionPaper;
            var file = bucket.file(filePath);

            file.delete()
                .then(() => {
                    return Assessments.findByIdAndDelete(assessmentId).exec();
                })
                .then(() => {
                    return Answers.deleteMany({ assessment: assessmentId }).exec();
                })
                .then(() => {
                    res.status(200).json({
                        message: "Assessment and associated files deleted successfully",
                        docs: assessment,
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