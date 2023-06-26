var mongoose = require('mongoose');
var express = require('express');
var Bus = require('../models/Bus');
var checkAuth = require('../middleware/checkAuth');
var router = express.Router();

router.get("/", checkAuth, (req, res) => {
    Bus.find().exec()
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
    Bus.findById(req.params.id).exec()
        .then(doc => {
            res.status(200).json({
                doc: doc
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.post("/", checkAuth, (req, res) => {
    var bus = new Bus({
        _id : new mongoose.Types.ObjectId(),
        busNumber : req.body.busNumber,
        availableSeats : req.body.maxSeats,
        maxSeats : req.body.maxSeats
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
    for (const ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Bus.findByIdAndUpdate(id, updateOps).exec()
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

router.delete("/:id", checkAuth, (req, res) => {
  Bus.findByIdAndDeleted(req.params.id).exec()
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