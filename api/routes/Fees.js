var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var checkAuth = require('../middleware/checkAuth');
var Fees = require('../models/Fees');
var Students = require('../models/Students');
var Payments = require('../models/Payments');


/* This code is defining a GET route for the root URL ("/") of the server. It is using the `checkAuth`
middleware function to authenticate the request. */
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

/* This code is defining a GET route for the URL "/:id" of the server. It is using the `checkAuth`
middleware function to authenticate the request. */
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

/* The `router.post("/", checkAuth, (req, res) => { ... })` code block is defining a POST route for the
root URL ("/") of the server. It is using the `checkAuth` middleware function to authenticate the
request. */
router.post("/", checkAuth, (req, res) => {
    var fee = new Fees({
        _id: new mongoose.Types.ObjectId(),
        amount: req.body.amount,
        due: req.body.due ? req.body.due : null,
        description: req.body.description,
        standard: req.body.standard
    });
    fee.save()
        .then(docs => {
            if (docs.standard) {
                Students.find({ standard: docs.standard }).select('_id').exec()
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

/* The `router.patch("/:id", checkAuth, (req, res) => { ... })` code block is defining a PATCH route
for the URL "/:id" of the server. It is using the `checkAuth` middleware function to authenticate
the request. */
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

/* The `router.delete("/:id", checkAuth, (req, res) => { ... })` code block is defining a DELETE route
for the URL "/:id" of the server. It is using the `checkAuth` middleware function to authenticate
the request. */
router.delete("/:id", checkAuth, (req, res) => {
    Fees.findByIdAndDelete(req.params.id).exec()
        .then(docs => {
            Payments.deletemany({ fees: docs._id })
                .then(docs => {
                    res.status(200).json({
                        message: "Fees Record Deleted Successfully",
                        docs: docs
                    });
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });
        }).catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

module.exports = router;