var mongoose = require('mongoose');
var Workers = require("../models/Workers");
var checkAuth = require('../middleware/checkAuth');
var express = require('express');
var router = express.Router();

/* This code is defining a GET route for the root URL ("/") of the server. When a GET request is made
to this route, it first checks if the user is authenticated by calling the `checkAuth` middleware
function. If the user is authenticated, it executes the callback function `(req, res) => {...}`. */
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

/* This code defines a GET route for the URL "/:id" of the server. When a GET request is made to this
route, it first checks if the user is authenticated by calling the `checkAuth` middleware function.
If the user is authenticated, it executes the callback function `(req, res) => {...}`. */
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

/* The code `router.post("/", checkAuth, (req, res) => {...})` is defining a POST route for the root
URL ("/") of the server. When a POST request is made to this route, it first checks if the user is
authenticated by calling the `checkAuth` middleware function. If the user is authenticated, it
executes the callback function `(req, res) => {...}`. */
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

/* The `router.patch("/:id", checkAuth, checkAuth, (req, res, next) => {...})` code is defining a PATCH
route for the URL "/:id" of the server. When a PATCH request is made to this route, it first checks
if the user is authenticated by calling the `checkAuth` middleware function. If the user is
authenticated, it executes the callback function `(req, res, next) => {...}`. */
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

/* The code `router.delete("/:id", checkAuth, (req, res, next) => {...})` is defining a DELETE route
for the URL "/:id" of the server. When a DELETE request is made to this route, it first checks if
the user is authenticated by calling the `checkAuth` middleware function. If the user is
authenticated, it executes the callback function `(req, res, next) => {...}`. */
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
