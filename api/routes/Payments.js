var mongoose = require('mongoose');
var express = require('express');
var Payments = require('../models/Payments');
var checkAuth = require('../middleware/checkAuth');
var router = express.Router();

router.get("/", checkAuth, (req, res) => {
    Payments.find().exec()
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
    Payments.findById(req.params.id).exec()
        .then(doc => {
            res.status(200).json({
                doc: doc
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

router.get("/students/:studentID",checkAuth, (req, res) => {
    Payments.find({ student: req.params.studentID }).exec()
        .then(doc => {
            res.status(200).json({
                doc: doc
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

router.post("/", checkAuth, (req, res) => {
    var payment = new Payments({
        _id: new mongoose.Types.ObjectId(),
        amount: req.body.amount,
        due: req.body.due,
        status: req.body.status,
        student: req.body.student
    });
    payment.save()
        .then(docs => {
            res.status(200).json({
                message: "New Payment Created",
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
