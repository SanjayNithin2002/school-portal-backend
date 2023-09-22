var mongoose = require('mongoose');
var express = require('express');
var Payments = require('../models/Payments');
var Students = require('../models/Students');
var checkAuth = require('../middleware/checkAuth');
var router = express.Router();

/* This code is defining a GET route for the root URL ("/") of the server. When a GET request is made
to this route, it first checks if the user is authenticated using the `checkAuth` middleware. If the
user is authenticated, it executes the callback function `(req, res) => {...}`. */
router.get("/", checkAuth, (req, res) => {
    Payments.find().populate('fees').exec()
        .then(docs => {
            var docs = docs.filter(doc => doc.fees.due != null);
            res.status(200).json({
                docs: docs
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

/* This code is defining a GET route for the URL pattern "/:id" of the server. When a GET request is
made to this route, it first checks if the user is authenticated using the `checkAuth` middleware.
If the user is authenticated, it executes the callback function `(req, res) => {...}`. */
router.get("/:id", checkAuth, (req, res) => {
    Payments.findById(req.params.id).populate('fees').exec()
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

/* This code defines a GET route for the URL pattern "/students/:studentID" of the server. When a GET
request is made to this route, it first checks if the user is authenticated using the `checkAuth`
middleware. If the user is authenticated, it executes the callback function `(req, res) => {...}`. */
router.get("/students/:studentID", checkAuth, (req, res) => {
    Payments.find({ student: req.params.studentID }).populate('fees').exec()
        .then(docs => {
            var docs = docs.filter(doc => doc.fees.due != null);
            res.status(200).json({
                docs: docs
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

/* The code `router.post("/", checkAuth, (req, res) => {...})` is defining a POST route for the root
URL ("/") of the server. When a POST request is made to this route, it first checks if the user is
authenticated using the `checkAuth` middleware. If the user is authenticated, it executes the
callback function `(req, res) => {...}`. */
router.post("/", checkAuth, (req, res) => {
    var payment = new Payments({
        _id: new mongoose.Types.ObjectId(),
        fees: req.body.fees,
        status: req.body.status,
        student: req.body.student
    });
    payment.save()
        .then(docs => {
            res.status(201).json({
                message: "New Payment Created",
                docs: docs
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            });
        });
});


/* The code `router.patch("/:id", checkAuth, (req, res) => {...})` is defining a PATCH route for the
URL pattern "/:id" of the server. When a PATCH request is made to this route, it first checks if the
user is authenticated using the `checkAuth` middleware. If the user is authenticated, it executes
the callback function `(req, res) => {...}`. */
router.patch("/:id", checkAuth, (req, res) => {
    var id = req.params.id;
    var updateOps = {};
    for (var ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Payments.findByIdAndUpdate(id, updateOps).exec()
        .then(docs => {
            res.status(200).json({
                message: "Payment Updated",
                docs: docs
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            });
        });
});



/* The code `router.delete("/:id", checkAuth, (req, res) => {...})` is defining a DELETE route for the
URL pattern "/:id" of the server. When a DELETE request is made to this route, it first checks if
the user is authenticated using the `checkAuth` middleware. If the user is authenticated, it
executes the callback function `(req, res) => {...}`. */
router.delete("/:id", checkAuth, (req, res) => {
    Payments.findByIdAndDelete(req.params.id).exec()
        .then(docs => {
            res.status(200).json({
                message: "Payment Deleted",
                docs: docs
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

module.exports = router;
