var mongoose = require('mongoose');
var express = require('express');
var Buses = require('../models/Buses');
var Payments = require('../models/Payments');
var checkAuth = require('../middleware/checkAuth');
var router = express.Router();

router.get("/", checkAuth, (req, res) => {
    Buses.find().populate("students").exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.get("/:id", checkAuth, (req, res) => {
    Buses.findById(req.params.id).populate("students").exec()
        .then(doc => {
            res.status(200).json({
                docs: doc
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.post("/", checkAuth, (req, res) => {
    var bus = new Buses({
        _id: new mongoose.Types.ObjectId(),
        busNumber: req.body.busNumber,
        stops : req.body.stops,
        availableSeats: req.body.maxSeats,
        maxSeats: req.body.maxSeats,
        students: []
    });
    bus.save()
        .then(docs => {
            res.status(200).json({
                message: "New Bus Posted",
                docs: docs
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.patch("/:id", checkAuth, (req, res) => {
    var id = req.params.id;
    var updateOps = {};
    for (var ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Buses.findByIdAndUpdate(id, updateOps).exec()
        .then(docs => {
            res.status(200).json({
                message: "Bus Patched",
                docs: docs
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.patch("/", checkAuth, (req, res) => {
    var id = req.body.id;
    var studentID = req.body.studentID;
    var fees = req.body.fees;
    var due = req.body.due;
    Buses.findById(id).exec()
        .then(bus => {
            if (bus.availableSeats > 0) {
                Buses.findByIdAndUpdate(id, { $push: { students: studentID }, $inc: { availableSeats: -1 } }).exec()
                    .then(updatedBus => {
                        // Create a new payment
                        var payment = new Payments({
                            _id: new mongoose.Types.ObjectId(),
                            amount: fees,
                            due: due,
                            status: "Pending",
                            student: studentID
                        });

                        payment.save()
                            .then(newPayment => {
                                res.status(200).json({
                                    message: "Student Added to Bus",
                                    docs: updatedBus,
                                    payment: newPayment
                                });
                            })
                            .catch(err => {
                                console.error("Error saving payment:", err);
                                res.status(500).json({
                                    error: err.message
                                });
                            });
                    })
                    .catch(err => {
                        console.error("Error updating bus:", err);
                        res.status(500).json({
                            error: err.message
                        });
                    });
            } else {
                res.status(400).json({
                    message: "No available seats on the bus"
                });
            }
        })
        .catch(err => {
            console.error("Error finding bus:", err);
            res.status(500).json({
                error: err.message
            });
        });
});

router.delete("/:id", checkAuth, (req, res) => {
    Buses.findByIdAndDelete(req.params.id).exec()
        .then(docs => {
            res.status(200).json({
                message: "Bus Deleted",
                docs: docs
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

module.exports = router;