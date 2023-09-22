var mongoose = require('mongoose');
var express = require('express');
var Exams = require('../models/Exams');
var Students = require('../models/Students');
var Classes = require('../models/Classes');
var timeToString = require('../middleware/timeToString');
var router = express.Router();
var checkAuth = require('../middleware/checkAuth');

/* This code is defining a GET route for the root URL ("/") of the server. When a GET request is made
to this route, it will execute the callback function. */
router.get("/", checkAuth, (req, res) => {
    Exams.find().populate('class').exec()
        .then(docs => {
            console.log(docs)
            res.status(200).json({
                docs: docs.map(doc => {
                    return {
                        _id: doc._id,
                        date: doc.date,
                        startTime: timeToString(doc.startTime),
                        endTime: timeToString(doc.endTime),
                        maxMarks: doc.maxMarks,
                        //weightageMarks: doc.weightageMarks,
                        //examName: doc.examName,
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

/* This code defines a GET route for the "/students/:studentID" URL of the server. When a GET request
is made to this route, it will execute the callback function. */
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

/* This code defines a GET route for the "/standard/:standard" URL of the server. When a GET request is
made to this route, it will execute the callback function. */
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

/* This code defines a GET route for the "/teachers/:id" URL of the server. When a GET request is made
to this route, it will execute the callback function. */
router.get('/teachers/:id', checkAuth, (req, res) => {
    Exams.find().populate('class').exec()
        .then(docs => {
            var docs = docs.filter(doc => doc.class.teacher == req.params.id && doc.class.teacher != null);
            res.status(200).json({
                docs: docs
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The code you provided is defining a POST route for the root URL ("/") of the server. When a POST
request is made to this route, it will execute the callback function. */
router.post("/", checkAuth, (req, res) => {
    var exam = new Exams({
        _id: new mongoose.Types.ObjectId(),
        class: req.body.class,
        date: req.body.date,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        maxMarks: req.body.maxMarks,
        weightageMarks: req.body.weightageMarks ? req.body.weightageMarks : req.body.maxMarks,
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

/* The `router.post("/postmany", checkAuth, (req, res) => { ... })` code is defining a POST route for
the "/postmany" URL of the server. When a POST request is made to this route, it will execute the
callback function. */
router.post("/postmany", checkAuth, (req, res) => {
    var exams = req.body;
    var exams = exams.map(exam => {
        return {
            _id: new mongoose.Types.ObjectId(),
            class: exam.class,
            date: exam.date,
            startTime: exam.startTime,
            endTime: exam.endTime,
            maxMarks: exam.maxMarks,
            weightageMarks: exam.weightageMarks ? exam.weightageMarks : exam.maxMarks,
            examName: exam.examName
        }
    });
    Exams.insertMany(exams)
        .then(docs => {
            res.status(201).json({
                message: "Exam Records Posted Successfully",
                docs: docs
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The `router.patch("/:id", checkAuth, (req, res) => { ... })` code is defining a PATCH route for the
"/:id" URL of the server. When a PATCH request is made to this route, it will execute the callback
function. */
router.patch("/:id", checkAuth, (req, res) => {
    var updateOps = {};
    for (var ops of req.body) {
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

/* The `router.delete("/:id", checkAuth, (req, res) => { ... })` code is defining a DELETE route for
the "/:id" URL of the server. When a DELETE request is made to this route, it will execute the
callback function. */
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