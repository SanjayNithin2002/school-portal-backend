var mongoose = require('mongoose');
var PersonalMessages = require('../models/PersonalMessages');
var express = require('express');
var router = express.Router();

router.get("/", (req, res) => {
    PersonalMessages.find().populate([{ path: "teacher" }, { path: "student" }]).exec()
        .then(docs => {
            var personalMessages = docs.map(doc => {
                return {
                    _id: doc._id,
                    teacher: doc.teacher,
                    student: doc.student,
                    message: doc.message,
                    date: doc.date
                }
            });
            res.status(200).json(personalMessages);
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});
router.get("/:id", (req, res) => {
    PersonalMessages.findById(req.params.id).populate([{ path: "teacher" }, { path: "student" }]).exec()
        .then(doc => {
            if (doc) {
                res.status(200).json({
                    _id: doc._id,
                    teacher: doc.teacher,
                    student: doc.student,
                    message: doc.message,
                    date: doc.date
                });
            } else {
                res.status(404).json({
                    message: "No valid entry found for provided ID"
                });
            }
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});
router.get("/students/:studentID", (req, res) => {
    PersonalMessages.find({ student: req.params.studentID }).populate([{ path: "teacher" }, { path: "student" }]).exec()
        .then(docs => {
            var personalMessages = docs.map(doc => {
                return {
                    _id: doc._id,
                    teacher: doc.teacher,
                    student: doc.student,
                    message: doc.message,
                    date: doc.date
                }
            });
            res.status(200).json(personalMessages);
        }
        )
        .catch(err => {
            res.status(500).json({
                error: err
            });
        }
        );
});
router.get("/teachers/:teacherID", (req, res) => {
    PersonalMessages.find({ teacher: req.params.teacherID }).populate([{ path: "teacher" }, { path: "student" }]).exec()
        .then(docs => {
            var personalMessages = docs.map(doc => {
                return {
                    _id: doc._id,
                    teacher: doc.teacher,
                    student: doc.student,
                    message: doc.message,
                    date: doc.date
                }
            });
            res.status(200).json(personalMessages);
        }
        )
        .catch(err => {
            res.status(500).json({
                error: err
            });
        }
        );
});
router.post("/", (req, res) => {
    const personalMessages = new PersonalMessages({
        _id: new mongoose.Types.ObjectId(),
        teacher: req.body.teacher,
        student: req.body.student,
        message: req.body.message,
        date: req.body.date ? req.body.date : new Date().toJSON().slice(0, 10)
    });
    personalMessages.save()
        .then(result => {
            res.status(201).json({
                message: "Created personalMessages successfully",
                createdPersonalMessages: {
                    _id: result._id,
                    teacher: result.teacher,
                    student: result.student,
                    message: result.message,
                    date: result.date
                }
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});
router.delete("/:id", (req, res) => {
    PersonalMessages.findByIdAndDelete(req.params.id)
        .then(result => {
            res.status(200).json({
                message: "PersonalMessages deleted",
                deletedPersonalMessages: {
                    _id: result._id,
                    teacher: result.teacher,
                    student: result.student,
                    message: result.message,
                    date: result.date
                }
            });
        }
        )
        .catch(err => {
            res.status(500).json({
                error: err
            });
        }
        );
});

module.exports = router;