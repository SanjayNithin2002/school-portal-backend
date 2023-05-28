var mongoose = require('mongoose');
var Timetable = require('../models/Timetable');
var express = require('express');
var router = express.Router();

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
            res.status(200).json(timetables);
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});
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
            res.status(200).json(timetables);
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});
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
                createdTimetable: {
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
                request: {
                    type: "GET",
                    url: "http://localhost:3000/timetables/" + id
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
    Timetable.findByIdAndDelete(req.params.id).exec()
        .then(result => {
            res.status(200).json({
                message: "Timetable deleted",
                request: {
                    type: "POST",
                    url: "http://localhost:3000/timetables",
                    body: {
                        standard: "Number",
                        workingDays: "[String]",
                        startTime: "String",
                        endTime: "String",
                        duration: "Number",
                        break: "[{title: String, startTime: String, endTime: String}]"
                    }
                }
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

module.exports = router;