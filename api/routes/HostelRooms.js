var mongoose = require('mongoose');
var express = require('express');
var HostelRooms = require('../models/HostelRooms');
var Payments = require('../models/Payments');
var checkAuth = require('../middleware/checkAuth');
var router = express.Router();

router.get("/", checkAuth, (req, res) => {
    HostelRooms.find().populate("students").exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

router.get("/:id", checkAuth, (req, res) => {
    HostelRooms.findById(req.params.id).populate("students").exec()
        .then(doc => {
            res.status(200).json({
                docs: doc
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

router.post("/", checkAuth, (req, res) => {
    var hostelRoom = new HostelRooms({
        _id: new mongoose.Types.ObjectId(),
        type: req.body.type,
        available: req.body.maximum,
        maximum: req.body.maximum,
        fees: req.body.fees,
        paymentDue : req.body.paymentDue,
        students: []
    });
    hostelRoom.save()
        .then(docs => {
            res.status(200).json({
                message: "New Hostel Room Created",
                docs: docs
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

router.patch("/:id", checkAuth, (req, res) => {
    var id = req.params.id;
    var updateOps = {};
    for (const ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    HostelRooms.findByIdAndUpdate(id, updateOps).exec()
        .then(docs => {
            res.status(200).json({
                message: "Hostel Room Updated",
                docs: docs
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

router.patch("/:id/addstudent/:studentID", checkAuth, (req, res) => {
    HostelRooms.findById(req.params.id).exec()
        .then(doc => {
            if (doc.available > 0) {
                HostelRooms.findByIdAndUpdate(req.params.id, { $push: { students: req.params.studentID }, $inc: { available: -1 } }).exec()
                    .then(updatedDoc => {
                        var payment = new Payments({
                            _id: new mongoose.Types.ObjectId(),
                            amount: doc.fees,
                            due: req.body.paymentDue,
                            status: "Pending",
                            student: req.params.studentID
                        });
                        payment.save()
                            .then(newDocs => {
                                res.status(200).json({
                                    message: "Student Added",
                                    docs: updatedDoc,
                                    payment: newDocs
                                });
                            }).catch(err => {
                                console.error("Error saving payment:", err);
                                res.status(500).json({
                                    error: err.message
                                });
                            });
                    }).catch(err => {
                        console.error("Error updating hostel room:", err);
                        res.status(500).json({
                            error: err.message
                        });
                    });
            } else {
                res.status(400).json({
                    message: "No available rooms"
                });
            }
        }).catch(err => {
            console.error("Error finding hostel room:", err);
            res.status(500).json({
                error: err.message
            });
        });
});


router.delete("/:id", checkAuth, (req, res) => {
    HostelRooms.findByIdAndDelete(req.params.id).exec()
        .then(docs => {
            res.status(200).json({
                message: "Hostel Room Deleted",
                docs: docs
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

module.exports = router;
