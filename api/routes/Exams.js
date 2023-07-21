var mongoose = require('mongoose');
var express = require('express');
var Exams = require('../models/Exams');
var Students = require('../models/Students');
var Classes = require('../models/Classes');
var timeToString = require('../middleware/timeToString');
var router = express.Router();
var checkAuth = require('../middleware/checkAuth');

router.get("/", checkAuth, (req, res) => {
    Exams.find().populate('class').exec()
        .then(docs => {
            res.status(200).json({
                docs: docs.map(doc => {
                    return {
                        _id: doc._id,
                        date: doc.date,
                        startTime: timeToString(doc.startTime),
                        endTime: timeToString(doc.endTime),
                        maxMarks: doc.maxMarks,
                        weightageMarks: doc.weightageMarks,
                        examName: doc.examName,
                        subject: doc.class.subject,
                        standard: doc.class.standard,
                        section: doc.class.section
                    }
                })
            })
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
            Exams.find().populate('class').exec()
                .then(docs => {
                    var exams = docs.filter(doc => {
                        return doc.class.standard === standard && doc.class.section === section
                    });
                    var exams = exams.map(doc => {
                        return {
                            _id: doc._id,
                            date: doc.date,
                            startTime: doc.startTime,
                            endTime: doc.endTime,
                            maxMarks: doc.maxMarks,
                            weightageMarks: doc.weightageMarks,
                            examName: doc.examName,
                            subject: doc.class.subject,
                            standard: doc.class.standard,
                            section: doc.class.section
                        }
                    });
                    res.status(200).json({
                        docs: exams
                    });
                }).catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });

});

router.get("/standard/:standard", checkAuth, (req, res) => {
    Exams.find().populate('class').exec()
        .then(docs => {
            var docs = docs.filter(doc => doc.class.standard == req.params.standard);
            res.status(200).json({
                docs: docs
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});


router.post("/", checkAuth, (req, res) => {
    var exam = new Exams({
        _id: new mongoose.Types.ObjectId(),
        class: req.body.class,
        date: req.body.date,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        maxMarks: req.body.maxMarks,
        weightageMarks: req.body.weightageMarks,
        examName: req.body.examName
    });
    exam.save()
        .then(doc => {
            res.status(201).json({
                message: "Exam Posted Successfully",
                docs: doc
            })
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
    Exams.findByIdAndUpdate(req.params.id, updateOps).exec()
        .then(doc => {
            res.status(200).json({
                message: "Exam Updated",
                docs: doc
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.delete("/:id", checkAuth, (req, res) => {
    Exams.findByIdAndDelete(req.params.id).exec()
        .then(doc => {
            res.status(201).json({
                message: "Exam Deleted Successfully",
                docs: doc
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});
module.exports = router;