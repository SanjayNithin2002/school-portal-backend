var mongoose = require('mongoose');
var PersonalMessages = require('../models/PersonalMessages');
var express = require('express');
var router = express.Router();
var checkAuth = require('../middleware/checkAuth');

router.get("/", checkAuth, (req, res) => {
    PersonalMessages.find().populate([{ path: "postedBy" }, { path: "student" }]).exec()
        .then(docs => {
            var personalMessages = docs.map(doc => {
                return {
                    _id: doc._id,
                    postedBy: doc.postedBy,
                    student: doc.student,
                    message: doc.message,
                    date: doc.postedOn
                }
            });
            res.status(200).json({
                docs: personalMessages
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});
router.get("/:id", checkAuth, (req, res) => {
    PersonalMessages.findById(req.params.id).populate([{ path: "postedBy" }, { path: "student" }]).exec()
        .then(doc => {
            if (doc) {
                res.status(200).json({
                    _id: doc._id,
                    postedBy: doc.postedBy,
                    student: doc.student,
                    message: doc.message,
                    date: doc.postedOn
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

router.get("/students/:studentID", checkAuth, (req, res) => {
    PersonalMessages.find({ student: req.params.studentID }).populate([{ path: "postedBy" }, { path: "student" }]).exec()
        .then(docs => {
            var personalMessages = docs.map(doc => {
                return {
                    _id: doc._id,
                    postedBy: doc.postedBy,
                    student: doc.student,
                    message: doc.message,
                    date: doc.postedOn
                }
            });
            res.status(200).json({
                docs: personalMessages
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
router.get("/teachers/:teacherID", checkAuth, (req, res) => {
    PersonalMessages.find({ teacher: req.params.teacherID }).populate([{ path: "postedBy" }, { path: "student" }]).exec()
        .then(docs => {
            var personalMessages = docs.map(doc => {
                return {
                    _id: doc._id,
                    postedBy: doc.postedBy,
                    student: doc.student,
                    message: doc.message,
                    date: doc.postedOn
                }
            });
            res.status(200).json({
                docs: personalMessages
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
router.post("/", checkAuth, (req, res) => {
    var personalMessages = new PersonalMessages({
        _id: new mongoose.Types.ObjectId(),
        postedBy: req.body.postedBy,
        student: req.body.student,
        message: req.body.message,
        postedOn: req.body.postedOn ? req.body.postedOn : new Date().toJSON()
    });
    personalMessages.save()
        .then(result => {
            res.status(201).json({
                message: "Created personalMessages successfully",
                docs: {
                    _id: result._id,
                    postedBy: result.postedBy,
                    student: result.student,
                    message: result.message,
                    postedOn: result.postedOn
                }
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

router.delete("/:id", checkAuth, (req, res) => {
    PersonalMessages.findByIdAndDelete(req.params.id)
        .then(result => {
            res.status(200).json({
                message: "PersonalMessages deleted",
                docs : {
                    _id: result._id,
                    postedBy: result.postedBy,
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