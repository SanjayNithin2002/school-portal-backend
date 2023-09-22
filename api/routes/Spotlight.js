var mongoose = require('mongoose');
var express = require('express');
var Spotlight = require('../models/Spotlight');
var checkAuth = require('../middleware/checkAuth');
var router = express.Router();

/* This code is defining a GET route for the root URL ("/"). When a GET request is made to this route,
it will execute the callback function. */
router.get("/", (req, res) => {
    Spotlight.find().exec()
        .then(docs => {
            res.status(200).json({
                message: docs
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* This code is defining a GET route for the URL "/:id", where ":id" is a dynamic parameter that
represents the ID of a specific spotlight. When a GET request is made to this route, it will execute
the callback function. */
router.get("/:id", (req, res) => {
    Spotlight.findById(req.params.id).exec()
        .then(docs => {
            if (!docs) {
                res.status(404).json({
                    error: "Spotlight Not Found"
                })
            } else {
                res.status(200).json({
                    message: docs
                });
            }
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The `router.post("/", checkAuth, (req, res) => { ... })` code is defining a POST route for the root
URL ("/"). When a POST request is made to this route, it will execute the callback function. */
router.post("/", checkAuth, (req, res) => {
    var spotlight = new Spotlight({
        _id: new mongoose.Types.ObjectId(),
        title: req.body.title,
        description: req.body.description,
        users: req.body.users,
        postedOn: req.body.postedOn ? req.body.postedOn : new Date().toJSON()
    });
    spotlight.save()
        .then(docs => {
            res.status(201).json({
                message: "Spotlight Created Successfully",
                docs: docs
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The `router.patch("/:id", checkAuth, (req, res) => { ... })` code is defining a PATCH route for the
URL "/:id", where ":id" is a dynamic parameter that represents the ID of a specific spotlight. When
a PATCH request is made to this route, it will execute the callback function. */
router.patch("/:id", checkAuth, (req, res) => {
    var id = req.params.id;
    var updateOps = {};
    for (var ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Spotlight.findByIdAndUpdate(id, updateOps).exec()
        .then(docs => {
            res.status(200).json({
                message: "Spotlight Updated Successfully",
                docs: docs
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The `router.delete("/:id", checkAuth, (req, res) => { ... })` code is defining a DELETE route for
the URL "/:id", where ":id" is a dynamic parameter that represents the ID of a specific spotlight.
When a DELETE request is made to this route, it will execute the callback function. */
router.delete("/:id", checkAuth, (req, res) => {
    Spotlight.findByIdAndDelete(req.params.id).exec()
        .then(docs => {
            res.status(200).json({
                message: "Spotlight Deleted Successfully"
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

module.exports = router;