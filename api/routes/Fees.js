var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var checkAuth = require('../middleware/checkAuth');
var Fees = require('../models/Fees');
var Students = require('../models/Students');
var Payments = require('../models/Payments');


router.get("/", checkAuth, (req, res) => {
    Fees.find().exec()
        .then(docs => {
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

router.get("/:id", checkAuth, (req, res) => {
    Fees.findById(req.params.id).exec()
        .then(docs => {
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

router.post("/", checkAuth, (req, res) => {
    var fee = new Fees({
        _id: new mongoose.Types.ObjectId(),
        amount: req.body.amount,
        due: null,
        type: {
            main: req.body.type.main,
            category: req.body.type.category
        }
    });
    fee.save()
        .then(docs => {
            if (docs.type.main === "Academics") {
                Students.find({ standard: docs.type.category }).select('_id').exec()
                    .then(students => {
                        var payments = students.map(student => {
                            return {
                                _id: new mongoose.Types.ObjectId(),
                                student: student._id,
                                status: "Pending",
                                fees: docs._id
                            }
                        });
                        Payments.insertMany(payments)
                            .then(docs => {
                                res.status(201).json({
                                    message: "Fees Posted and Payment Requests Created Successfully",
                                    docs: docs
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
            }
            else if (docs.type.main === "Hostel") {
                Students.find({ 'hostelDetails.roomType' : docs.type.category }).select('_id').exec()
                    .then(students => {
                        console.log(students)
                        var payments = students.map(student => {
                            return {
                                _id: new mongoose.Types.ObjectId(),
                                student: student._id,
                                status: "Pending",
                                fees: docs._id
                            }
                        });
                        Payments.insertMany(payments)
                            .then(docs => {
                                res.status(201).json({
                                    message: "Fees Posted and Payment Requests Created Successfully",
                                    docs: docs
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
            }
            else if (docs.type.main === "Mess") {
                Students.find({ 'hostelDetails.foodType' : docs.type.category }).select('_id').exec()
                    .then(students => {
                        console.log(students)
                        var payments = students.map(student => {
                            return {
                                _id: new mongoose.Types.ObjectId(),
                                student: student._id,
                                status: "Pending",
                                fees: docs._id
                            }
                        });
                        Payments.insertMany(payments)
                            .then(docs => {
                                res.status(201).json({
                                    message: "Fees Posted and Payment Requests Created Successfully",
                                    docs: docs
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
            }
            else if (docs.type.main === "Bus") {
                Students.find({ 'busDetails.busStopArea' : docs.type.category }).select('_id').exec()
                    .then(students => {
                        console.log(students)
                        var payments = students.map(student => {
                            return {
                                _id: new mongoose.Types.ObjectId(),
                                student: student._id,
                                status: "Pending",
                                fees: docs._id
                            }
                        });
                        Payments.insertMany(payments)
                            .then(docs => {
                                res.status(201).json({
                                    message: "Fees Posted and Payment Requests Created Successfully",
                                    docs: docs
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
            }
            else {
                res.status(404).json({
                    message: "Invalid Parameters"
                });
            }
        })
        .catch(err => {
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
    Fees.findByIdAndUpdate(id, updateOps).exec()
        .then(docs => {
            res.status(200).json({
                message: "Fees Updated Successfully",
                docs: docs
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.delete("/:id", checkAuth, (req, res) => {
    Fees.findByIdAndDelete(req.params.id).exec()
        .then(docs => {
            res.status(200).json({
                message: "Fees Record Deleted Successfully",
                docs: docs
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

module.exports = router;