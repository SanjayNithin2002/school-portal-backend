var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var timeToString = require('../middleware/timeToString');
var Classes = require('../models/Classes');
var Students = require('../models/Students');
var checkAuth = require('../middleware/checkAuth');

router.get("/", checkAuth, (req, res, next) => {
    Classes.find().populate('teacher').exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.get("/:id", checkAuth, (req, res, next) => {
    Classes.findById(req.params.id).populate('teacher').exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.get("/students/:studentID", (req, res, next) => {
    Students.findById(req.params.studentID).exec()
        .then(studDoc => {
            var standard = studDoc.standard;
            var section = studDoc.section;
            Classes.find().populate('teacher').exec()
                .then(docs => {
                    var classes = docs.filter(doc => doc.standard === standard && doc.section === section);
                    res.status(200).json({
                        docs: classes
                    });
                })
                .catch(err => {
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

router.get("/teachers/:teacherID", checkAuth, (req, res, next) => {
    Classes.find({ teacher: req.params.teacherID }).populate('teacher').exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.get("/standard/:standard", (req, res, next) => {
    Students.find({ standard: req.params.standard }).exec()
        .then(studDocs => {
            var sections = studDocs.map(doc => doc.section);
            var uniqueSections = [...new Set(sections)];
            // section wise boys and girls count
            var count = {};
            uniqueSections.forEach(section => {
                count[section] = {
                    male : 0,
                    female : 0
                }
            });
            studDocs.forEach(doc => {
                count[doc.section][doc.gender]++;
            });
            Classes.find({ standard: req.params.standard }).populate('teacher').exec()
                .then(docs => {
                    var subjects = docs.map(doc => doc.subject);
                    var uniqueSubjects = [...new Set(subjects)];
                    res.status(200).json({
                        subjects: uniqueSubjects,
                        sections: uniqueSections,
                        count: count
                    })
                })
                .catch(err => {
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
})

router.post("/", checkAuth, (req, res, next) => {
    var classes = new Classes({
        _id: new mongoose.Types.ObjectId(),
        teacher: req.body.teacher,
        standard: req.body.standard,
        section: req.body.section,
        subject: req.body.subject,
        timings: req.body.timings ? req.body.timings.map(timing => {
            return {
                startTime: timeToString(timing.startTime),
                endTime: timeToString(timing.endTime),
                day: timing.day
            }
        }) : []
    });
    classes.save()
        .then(docs => {
            res.status(201).json({
                message: "Class Created Successfully",
                docs: docs
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
})

module.exports = router;