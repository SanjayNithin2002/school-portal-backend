var mongoose = require('mongoose');
var Leave = require('../models/Leave');
var Teachers = require('../models/Teachers');
var Admins = require('../models/Admins');
var dateDiffInDays = require('../middleware/dateDiffInDays');
var express = require('express');
var router = express.Router();
var checkAuth = require('../middleware/checkAuth');



/* The following code is defining a route handler for a GET request to the root URL ("/"). It uses the
`checkAuth` middleware function to authenticate the request. */
router.get("/", checkAuth, (req, res, next) => {
    Leave.find().populate("teacher admin").exec()
        .then(docs => {
            res.status(200).json({
                docs: docs.map(doc => {
                    return {
                        _id: doc._id,
                        user: doc.user,
                        [doc.user]: doc[doc.user],
                        startDate: doc.startDate,
                        endDate: doc.endDate,
                        reason: doc.reason,
                        status: doc.status,
                        type: doc.type,
                        postedOn: doc.postedOn
                    }
                })
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});

/* The following code is defining a route handler for a GET request with a dynamic parameter ":id". It is
using the "checkAuth" middleware function to authenticate the request. */
router.get("/:id", checkAuth, (req, res, next) => {
    Leave.findById(req.params.id).exec()
        .then(doc => {
            res.status(200).json({
                _id: doc._id,
                user: doc.user,
                [doc.user]: doc[doc.user],
                startDate: doc.startDate,
                endDate: doc.endDate,
                reason: doc.reason,
                status: doc.status,
                type: doc.type,
                postedOn: doc.postedOn
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});

/* The following code is defining a route in a JavaScript router. This route is for GET requests to
"/teachers/:teacherID". It includes a middleware function called "checkAuth" to authenticate the
request. */
router.get("/teachers/:teacherID", checkAuth, (req, res) => {
    Leave.find({ teacher: req.params.teacherID }).populate("teacher").exec()
        .then(docs => {
            res.status(200).json({
                docs: docs.map(doc => {
                    return {
                        _id: doc._id,
                        user: doc.user,
                        [doc.user]: doc[doc.user],
                        startDate: doc.startDate,
                        endDate: doc.endDate,
                        reason: doc.reason,
                        status: doc.status,
                        type: doc.type,
                        postedOn: doc.postedOn
                    }
                })
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The following code is defining a route handler for GET requests to "/admins/:adminID". It uses the
checkAuth middleware to authenticate the request. */
router.get("/admins/:adminID", checkAuth, (req, res) => {
    Leave.find({ admin: req.params.adminID }).populate("admin").exec()
        .then(docs => {
            res.status(200).json({
                docs: docs.map(doc => {
                    return {
                        _id: doc._id,
                        user: doc.user,
                        [doc.user]: doc[doc.user],
                        startDate: doc.startDate,
                        endDate: doc.endDate,
                        reason: doc.reason,
                        status: doc.status,
                        type: doc.type,
                        postedOn: doc.postedOn
                    }
                })
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The following code is a route handler for a POST request. It is used to create a leave request for
either a teacher or an admin. */
router.post("/", checkAuth, (req, res, next) => {
    var currentDate = new Date();
    var startDate = new Date(req.body.startDate);
    if (currentDate <= startDate) {
        if (req.body.user === "teacher") {
            Teachers.findById(req.body.teacher).exec()
                .then(docs => {
                    if (docs) {
                        if (docs[req.body.type] < dateDiffInDays(req.body.startDate, req.body.endDate)) {
                            res.status(500).json({
                                message: "You Don't Have Enough " + req.body.type + " Leave"
                            })
                        } else {
                            var leave = new Leave({
                                _id: new mongoose.Types.ObjectId(),
                                user: req.body.user,
                                admin: null,
                                teacher: req.body.teacher,
                                type: req.body.type,
                                startDate: req.body.startDate,
                                endDate: req.body.endDate,
                                reason: req.body.reason,
                                postedOn: new Date().toJSON(),
                            });
                            leave.save()
                                .then(docs => {
                                    Teachers.findByIdAndUpdate(req.body.teacher, { $inc: { [req.body.type]: -dateDiffInDays(req.body.startDate, req.body.endDate) } }, { new: true }).exec()
                                        .then(doc => {
                                            res.status(201).json({
                                                message: "Leave Created Successfully",
                                                docs: docs
                                            })
                                        })
                                        .catch(err => {
                                            console.log(err);
                                            res.status(500).json({
                                                error: err
                                            })
                                        })
                                })
                                .catch(err => {
                                    res.status(500).json({
                                        error: err
                                    })
                                });
                        }
                    }
                    else {
                        res.status(404).json({
                            message: "Teacher Not Found",
                            doc: docs
                        })
                    }
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });
        }
        if (req.body.user === "admin") {
            Admins.findById(req.body.admin).exec()
                .then(docs => {
                    if (docs) {
                        if (docs[req.body.type] < dateDiffInDays(req.body.startDate, req.body.endDate)) {
                            res.status(500).json({
                                message: "You Don't Have Enough " + req.body.type + " Leave"
                            })
                        } else {
                            var leave = new Leave({
                                _id: new mongoose.Types.ObjectId(),
                                user: req.body.user,
                                admin: req.body.admin,
                                teacher: null,
                                type: req.body.type,
                                startDate: req.body.startDate,
                                endDate: req.body.endDate,
                                reason: req.body.reason,
                                postedOn: new Date().toJSON(),
                            });
                            leave.save()
                                .then(docs => {
                                    Admins.findByIdAndUpdate(req.body.admin, { $inc: { [req.body.type]: -dateDiffInDays(req.body.startDate, req.body.endDate) } }, { new: true }).exec()
                                        .then(doc => {
                                            res.status(201).json({
                                                message: "Leave Created Successfully",
                                                docs: docs
                                            })
                                        })
                                        .catch(err => {
                                            res.status(500).json({
                                                error: err
                                            })
                                        })
                                })
                                .catch(err => {
                                    res.status(500).json({
                                        error: err
                                    })
                                });
                        }
                    }
                    else {
                        res.status(404).json({
                            message: "Teacher Not Found"
                        })
                    }
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });

        }
    }
    else{
        res.status(400).json({
            message: "Too late to post"
        })
    }

});

/* The following code is a patch route handler for a router in a Node.js application. It is used to handle
requests to update the status of a leave request. */
router.patch("/", checkAuth, (req, res, next) => {
    if (req.body.user === "teacher") {
        if (req.body.status === "Approved") {
            Leave.findByIdAndUpdate(req.body.id, { $set: { status: req.body.status } }, { new: true }).exec()
                .then(docs => {
                    res.status(200).json({
                        message: "Leave Approved Successfully",
                        docs: docs
                    })
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });
        }
        if (req.body.status === "Rejected") {
            Leave.findByIdAndUpdate(req.body.id, { status: "Rejected" }).exec()
                .then(docs => {
                    Teachers.findByIdAndUpdate(docs.teacher, { $inc: { [docs.type]: dateDiffInDays(docs.startDate, docs.endDate) }, $set: { status: "Rejected" } }, { new: true }).exec()
                        .then(doc => {
                            res.status(200).json({
                                message: "Leave Cancelled Successfully",
                                docs: doc
                            })
                        })
                        .catch(err => {
                            res.status(500).json({
                                error: err
                            })
                        })
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                })
        }
    }
    if (req.body.user === "admin") {
        if (req.body.status === "Approved") {
            Leave.findByIdAndUpdate(req.body.id, { $set: { status: req.body.status } }, { new: true }).exec()
                .then(docs => {
                    res.status(200).json({
                        message: "Leave Approved Successfully",
                        docs: docs
                    })
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });
        }
        if (req.body.status === "Rejected") {
            Leave.findByIdAndUpdate(req.body.id, { status: "Rejected" }).exec()
                .then(docs => {
                    Admins.findByIdAndUpdate(docs.admin, { $inc: { [docs.type]: dateDiffInDays(docs.startDate, docs.endDate) } }, { new: true }).exec()
                        .then(doc => {
                            res.status(200).json({
                                message: "Leave Cancelled Successfully",
                                docs: doc
                            })
                        })
                        .catch(err => {
                            res.status(500).json({
                                error: err
                            })
                        })
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                })
        }
    }

});

/* The following code is defining a DELETE route for a router. It is checking if the user is authenticated
using the checkAuth middleware. It then finds a Leave document by its ID and checks if the start
date of the leave is greater than or equal to the current date. If it is, it checks if the user is a
teacher or an admin. If the user is a teacher, it removes the leave document and updates the
corresponding teacher document by decrementing the leave type by the number of days between the
start and end dates of the leave. If the user is an admin, it does the same */

router.delete("/:user/:id", checkAuth, (req, res, next) => {
    Leave.findById(req.params.id).exec()
        .then(docs => {
            var currentDate = new Date();
            if (docs.startDate >= currentDate) {
                if (req.params.user === "teacher") {
                    Leave.findByIdAndRemove(req.params.id).exec()
                        .then(docs => {
                            Teachers.findByIdAndUpdate(docs.teacher, { $inc: { [docs.type]: dateDiffInDays(docs.startDate, docs.endDate) } }, { new: true }).exec()
                                .then(doc => {
                                    res.status(200).json({
                                        message: "Leave Deleted Successfully",
                                        docs: doc
                                    })
                                })
                                .catch(err => {
                                    res.status(500).json({
                                        error: err
                                    })
                                })
                        })
                        .catch(err => {
                            res.status(500).json({
                                error: err
                            })
                        })
                }
                if (req.params.user === "admin") {
                    Leave.findByIdAndRemove(req.params.id).exec()
                        .then(docs => {
                            Admins.findByIdAndUpdate(docs.admin, { $inc: { [docs.type]: dateDiffInDays(docs.startDate, docs.endDate) } }, { new: true }).exec()
                                .then(doc => {
                                    res.status(200).json({
                                        message: "Leave Deleted Successfully",
                                        docs: doc
                                    })
                                })
                                .catch(err => {
                                    res.status(500).json({
                                        error: err
                                    })
                                })
                        })
                        .catch(err => {
                            res.status(500).json({
                                error: err
                            })
                        })
                }
            }
            else {
                res.status(400).json({
                    message: "Too late to delete"
                });
            }
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

module.exports = router;