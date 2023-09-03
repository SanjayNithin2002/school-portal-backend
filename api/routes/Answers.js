var mongoose = require("mongoose");
var Answers = require("../models/Answers");
var multer = require('multer');
var admin = require("firebase-admin");
var express = require("express");
var checkAuth = require('../middleware/checkAuth');
var makeUrlFriendly = require('../middleware/makeUrlFriendly');
var router = express.Router();

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./answers/");
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
}, "answers");

var bucket = admin.storage().bucket();

router.get("/", checkAuth, (req, res) => {
    Answers.find().populate([{ path: "assessment", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(docs => {
            var answers = docs.map(doc => {
                return {
                    _id: doc._id,
                    assessment: doc.assessment,
                    student: doc.student,
                    answerFile: process.env.url + "/downloadfile/" + doc.answerFile.split("\\").join("/"),
                    postedOn: doc.postedOn
                }
            });
            res.status(200).json({
                count: docs.length,
                docs: answers
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

router.get("/:id", checkAuth, (req, res) => {
    Answers.findById(req.params.id).populate([{ path: "assessment", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(doc => {
            res.status(200).json({
                _id: doc._id,
                assessment: doc.assessment,
                student: doc.student,
                answerFile: process.env.url + "/downloadfile/" + doc.answerFile.split("\\").join("/"),
                postedOn: doc.postedOn
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        })
});

router.get("/assessments/:assID", checkAuth, (req, res) => {
    Answers.find({ assessment: req.params.assID }).populate([{ path: "assessment", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(docs => {
            var answers = docs.map(doc => {
                return {
                    _id: doc._id,
                    assessment: doc.assessment,
                    student: doc.student,
                    answerFile: process.env.url + "/downloadfile/" + doc.answerFile.split("\\").join("/"),
                    postedOn: doc.postedOn
                }
            });
            res.status(200).json({
                count: docs.length,
                docs: answers
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

router.get("/students/:studentID", checkAuth, (req, res) => {
    Answers.find({ student: req.params.studentID }).populate([{ path: "assessment", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(docs => {
            var answers = docs.map(doc => {
                return {
                    _id: doc._id,
                    assessment: doc.assessment,
                    student: doc.student,
                    answerFile: process.env.url + "/downloadfile/" + doc.answerFile.split("\\").join("/"),
                    postedOn: doc.postedOn
                }
            });
            res.status(200).json({
                count: docs.length,
                docs: answers
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

router.get("/teachers/:teacherID", checkAuth, (req, res) => {
    Answers.find().populate([{ path: "assessment", populate: { path: "class", populate: { path: "teacher" } } }, { path: "student" }]).exec()
        .then(docs => {
            var answers = docs.filter(doc => doc.assessment.class ? doc.assessment.class.teacher._id == req.params.teacherID : false).map(doc => {
                return {
                    _id: doc._id,
                    assessment: doc.assessment,
                    student: doc.student,
                    answerFile: process.env.url + "/downloadfile/" + doc.answerFile.split("\\").join("/"),
                    postedOn: doc.postedOn
                }
            });
            res.status(200).json({
                count: docs.length,
                docs: answers
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

router.post("/", checkAuth, upload.single('answerFile'), (req, res) => {
    var answer = new Answers({
        _id: new mongoose.Types.ObjectId(),
        assessment: req.body.assessment,
        student: req.body.student,
        answerFile: 'answers/' + makeUrlFriendly(req.file.filename),
        postedOn: new Date().toJSON()
    });
    answer.save()
        .then(doc => {
            bucket.upload(req.file.path, {
                destination: 'answers/' + makeUrlFriendly(req.file.filename),
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
                    console.log(file);
                    res.status(201).json({
                        message: "Answer Uploaded Successfully",
                        doc: doc
                    });
                }
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.patch("/:id", checkAuth, upload.single("answerFile"), (req, res) => {
    var id = req.params.id;
    Answers.findById(id)
        .exec()
        .then(answer => {
            if (!answer) {
                return res.status(404).json({
                    message: "Answer not found",
                });
            }
            var oldFilePath = answer.answerFile;
            var oldFile = bucket.file(oldFilePath);

            oldFile.delete()
                .then(() => {
                    var newFilePath = 'answers/' + makeUrlFriendly(req.file.filename);
                    var newFile = bucket.file(newFilePath);

                    bucket.upload(req.file.path, {
                        destination: 'answers/' + makeUrlFriendly(req.file.filename),
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
                            answer.answerFile = newFilePath;
                            answer.save()
                                .then(updatedAnswer => {
                                    res.status(200).json({
                                        message: "Answer Updated Successfully",
                                        docs: updatedAnswer
                                    });
                                })
                                .catch(err => {
                                    res.status(500).json({
                                        error: "Error uploading new file to Firebase Storage: " + err.message,
                                    });
                                });
                        }
                    }
                    );
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

router.delete("/:id", checkAuth, (req, res) => {
    var answerId = req.params.id;

    Answers.findById(answerId)
        .exec()
        .then(answer => {
            if (!answer) {
                return res.status(404).json({
                    message: "Answer not found",
                });
            }

            var filePath = answer.answerFile;
            var file = bucket.file(filePath);

            file.delete()
                .then(() => {
                    return Answers.findByIdAndDelete(answerId).exec();
                })
                .then(() => {
                    res.status(200).json({
                        message: "Answer and associated file deleted successfully",
                        doc: answer,
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