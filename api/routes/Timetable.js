var mongoose = require('mongoose');
var Timetable = require('../models/Timetable');
var express = require('express');
var router = express.Router();

/* This code is defining a GET route for the root URL ("/") of the server. When a GET request is made
to this route, it will execute the callback function. */
router.get("/", (req, res) => {
    Timetable.find().exec()
        .then(docs => {
            var timetables = docs.map(doc => {
                return {
                    _id: doc._id,
                    standard: doc.standard,
                    workingDays: doc.workingDays,
                    startTime: doc.startTime,
                    endTime: doc.endTime,
                    duration: doc.duration,
                    break: doc.break
                }
            });
            res.status(200).json({
                docs : timetables
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

/* This code is defining a GET route for the URL "/:id" of the server. When a GET request is made to
this route, it will execute the callback function. */
router.get("/:id", (req, res) => {
    Timetable.findById(req.params.id).exec()
        .then(doc => {
            if (doc) {
                res.status(200).json({
                    _id: doc._id,
                    standard: doc.standard,
                    workingDays: doc.workingDays,
                    startTime: doc.startTime,
                    endTime: doc.endTime,
                    duration: doc.duration,
                    break: doc.break
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

/* The `router.get("/standard/:standard", ...)` route is used to handle GET requests to the URL
"/standard/:standard". */
router.get("/standard/:standard", (req, res) => {
    Timetable.find({ standard: req.params.standard }).exec()
        .then(docs => {
            var timetables = docs.map(doc => {
                return {
                    _id: doc._id,
                    standard: doc.standard,
                    workingDays: doc.workingDays,
                    startTime: doc.startTime,
                    endTime: doc.endTime,
                    duration: doc.duration,
                    break: doc.break
                }
            });
            res.status(200).json({
                docs : timetables
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

/* The `router.post("/", ...)` function is defining a POST route for the root URL ("/") of the server.
When a POST request is made to this route, it will execute the callback function. */
router.post("/", (req, res) => {
    var timetable = new Timetable({
        _id: new mongoose.Types.ObjectId(),
        standard: req.body.standard,
        workingDays: req.body.workingDays,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        duration: req.body.duration,
        break: req.body.break
    });
    timetable.save()
        .then(result => {
            res.status(201).json({
                message: "Created timetable successfully",
                docs: {
                    _id: result._id,
                    standard: result.standard,
                    workingDays: result.workingDays,
                    startTime: result.startTime,
                    endTime: result.endTime,
                    duration: result.duration,
                    break: result.break
                }
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

/* The `router.patch("/:id", ...)` function is defining a PATCH route for the URL "/:id" of the server.
When a PATCH request is made to this route, it will execute the callback function. */
router.patch("/:id", (req, res) => {
    var id = req.params.id;
    var updateOps = {};
    for (var ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Timetable.update({ _id: id }, { $set: updateOps }).exec()
        .then(result => {
            res.status(200).json({
                message: "Timetable updated",
                docs : result
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

/* The `router.delete("/:id", ...)` function is defining a DELETE route for the URL "/:id" of the
server. When a DELETE request is made to this route, it will execute the callback function. */
router.delete("/:id", (req, res) => {
    Timetable.findByIdAndDelete(req.params.id).exec()
        .then(result => {
            res.status(200).json({
                message: "Timetable deleted",
                docs : result
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

module.exports = router;