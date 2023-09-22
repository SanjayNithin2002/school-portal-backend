var mongoose = require('mongoose');
var PersonalMessages = require('../models/PersonalMessages');
var express = require('express');
var router = express.Router();
var checkAuth = require('../middleware/checkAuth');

/* This code is defining a GET route for the root URL ("/"). When a GET request is made to this route,
it will execute the callback function. */
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


/* The code `router.get("/:id", checkAuth, (req, res) => { ... })` is defining a GET route with a
dynamic parameter `:id`. This means that when a GET request is made to a URL that matches this route
pattern (e.g., "/personalMessages/123"), the callback function will be executed. */
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

/* The code `router.get("/students/:studentID", checkAuth, (req, res) => { ... })` is defining a GET
route with a dynamic parameter `:studentID`. This means that when a GET request is made to a URL
that matches this route pattern (e.g., "/students/123"), the callback function will be executed. */
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

/* The code `router.get("/teachers/:teacherID", checkAuth, (req, res) => { ... })` is defining a GET
route with a dynamic parameter `:teacherID`. This means that when a GET request is made to a URL
that matches this route pattern (e.g., "/teachers/123"), the callback function will be executed. */
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

/* The code `router.post("/", checkAuth, (req, res) => { ... })` is defining a POST route for the root
URL ("/"). When a POST request is made to this route, it will execute the callback function. */
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

/* The code `router.delete("/:id", checkAuth, (req, res) => { ... })` is defining a DELETE route with a
dynamic parameter `:id`. This means that when a DELETE request is made to a URL that matches this
route pattern (e.g., "/personalMessages/123"), the callback function will be executed. */
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