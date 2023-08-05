var mongoose = require('mongoose');
var Workers = require("../models/Workers");
var checkAuth = require('../middleware/checkAuth');
var express = require('express');
var router = express.Router();

router.get("/", checkAuth, (req, res) => {
    Workers.find().exec()
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
    const workerId = req.params.id;
    Workers.findById(workerId).exec()
        .then(docs => {
            if (!docs) {
                res.status(404).json({ message: "Worker not found" });
            } else {
                res.status(200).json({
                    docs: docs
                });
            }
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.post("/", checkAuth, (req, res) => {
    var worker = new Workers({
        _id: new mongoose.Types.ObjectId(),
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        empID: req.body.empID,
        dob: req.body.dob,
        gender: req.body.gender,
        bloodGroup: req.body.bloodGroup,
        aadharNumber: req.body.aadharNumber,
        motherTongue: req.body.motherTongue,
        address: {
            line1: req.body.address.line1,
            line2: req.body.address.line2,
            city: req.body.address.city,
            state: req.body.address.state,
            pincode: req.body.address.pincode
        },
        phoneNumber: req.body.phoneNumber,
        designation: req.body.designation,
        experience: req.body.experience,
        subjects: req.body.subjects,
        salaryDetails: {
            basic: req.body.salaryDetails.basic,
            hra: req.body.salaryDetails.hra,
            conveyance: req.body.salaryDetails.conveyance,
            pa: req.body.salaryDetails.pa,
            pf: req.body.salaryDetails.pf,
            pt: req.body.salaryDetails.pt,
        },
        busDetails: {
            isNeeded: (req.body.busDetails ? req.body.busDetails.isNeeded : false),
            busStopArea: (req.body.busDetails ? req.body.busDetails.busStopArea : "NA"),
            busStop: (req.body.busDetails ? req.body.busDetails.busStop : "NA"),
            availableBus: (req.body.busDetails ? req.body.busDetails.availableBus : "NA")
        },
        hostelDetails: {
            isNeeded: (req.body.hostelDetails ? req.body.hostelDetails.isNeeded : false),
            roomType: (req.body.hostelDetails ? req.body.hostelDetails.roomType : "NA"),
            foodType: (req.body.hostelDetails ? req.body.hostelDetails.foodType : "NA"),
        }
    });
    worker.save()
        .then(docs => {
            res.status(201).json({
                message: "Worker Created Successfully",
                docs: docs
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.patch("/:id", checkAuth, checkAuth, (req, res, next) => {
    var id = req.params.id;
    var updateOps = {};
    for (var ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Workers.findByIdAndUpdate(id, updateOps).exec()
        .then(docs => {
            res.status(200).json({
                message: "Worker Updated Successfully",
                docs: docs
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.delete("/:id", checkAuth, (req, res, next) => {
    var id = req.params.id;
    Workers.findByIdAndDelete(req.params.id)
        .exec()
        .then(docs => {
            res.status(200).json({
                message: "Worker Deleted Successfully",
                docs: docs
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

module.exports = router;
