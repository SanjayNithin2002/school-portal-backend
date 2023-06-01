var mongoose = require("mongoose");
var Answers = require("../models/Answers");
var multer = require('multer');
var admin = require("firebase-admin");
var express = require("express");
var checkAuth = require('../middleware/checkAuth');
var router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./answers/");
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
                    answerFile: "https://schoolportalbackend.onrender.com/downloadfile/" + doc.answerFile.split("\\").join("/"),
                    postedOn: doc.postedOn
                }
            });
            res.status(200).json({
                count: docs.length,
                answers: answers
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
                answerFile: "https://schoolportalbackend.onrender.com/downloadfile/" + doc.answerFile.split("\\").join("/"),
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
                    answerFile: "https://schoolportalbackend.onrender.com/downloadfile/" + doc.answerFile.split("\\").join("/"),
                    postedOn: doc.postedOn
                }
            });
            res.status(200).json({
                count: docs.length,
                answers: answers
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
                    answerFile: "https://schoolportalbackend.onrender.com/downloadfile/" + doc.answerFile.split("\\").join("/"),
                    postedOn: doc.postedOn
                }
            });
            res.status(200).json({
                count: docs.length,
                answers: answers
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
                    answerFile: "https://schoolportalbackend.onrender.com/downloadfile/" + doc.answerFile.split("\\").join("/"),
                    postedOn: doc.postedOn
                }
            });
            res.status(200).json({
                count: docs.length,
                answers: answers
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
        answerFile: req.file.path,
        postedOn: new Date().toJSON().slice(0, 10)
    });
    answer.save()
        .then(doc => {
            bucket.upload(req.file.path, {
                destination: 'answers/' + req.file.filename,
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
    //patch only the answerFile
    Answers.findByIdAndUpdate(req.params.id, { answerFile: req.file.path }, { new: true }).exec()
        .then(result => {
            res.status(201).json({
                message: "Answer updated",
                updatedAnswer: {
                    _id: result._id,
                    assessment: result.assessment,
                    student: result.student,
                    answerFile: result.answerFile
                }
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        })

});

router.delete("/:id", checkAuth, (req, res) => {
    Answers.findByIdAndDelete(req.params.id).exec()
        .then(result => {
            res.status(200).json({
                message: "Answer deleted"
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        })
});

module.exports = router;