var mongoose = require('mongoose');
var Leave = require('../models/Leave');
var Teachers = require('../models/Teachers');
var Admins = require('../models/Admins');
var dateDiffInDays = require('../middleware/dateDiffInDays');
var express = require('express');
var router = express.Router();
var checkAuth = require('../middleware/checkAuth');



router.get("/", checkAuth, (req, res, next) => {
    Leave.find().exec()
        .then(docs => {
            res.status(200).json({
                docs: docs.map(doc => {
                    return {
                        _id : doc._id,
                        user : doc.user,
                        [doc.user] : doc[doc.user],
                        startDate : doc.startDate,
                        endDate : doc.endDate,
                        reason : doc.reason,
                        status : doc.status,
                        type : doc.type,
                        postedOn : doc.postedOn
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

router.get("/:id", checkAuth, (req, res, next) => {
    Leave.findById(req.params.id).exec()
        .then(doc => {
            res.status(200).json({
                _id : doc._id,
                user : doc.user,
                [doc.user] : doc[doc.user],
                startDate : doc.startDate,
                endDate : doc.endDate,
                reason : doc.reason,
                status : doc.status,
                type : doc.type,
                postedOn : doc.postedOn
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});

router.get("/teachers/:teacherID", (req, res) => {
    Leave.find({ teacher: req.params.teacherID }).populate("teacher").exec()
        .then(docs => {
            res.status(200).json({
                docs: docs.map(doc => {
                    return {
                        _id : doc._id,
                        user : doc.user,
                        [doc.user] : doc[doc.user],
                        startDate : doc.startDate,
                        endDate : doc.endDate,
                        reason : doc.reason,
                        status : doc.status,
                        type : doc.type,
                        postedOn : doc.postedOn
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

router.get("/admins/:adminID", (req, res) => {
    Leave.find({ admin : req.params.adminID }).populate("admin").exec()
        .then(docs => {
            res.status(200).json({
                docs: docs.map(doc => {
                    return {
                        _id : doc._id,
                        user : doc.user,
                        [doc.user] : doc[doc.user],
                        startDate : doc.startDate,
                        endDate : doc.endDate,
                        reason : doc.reason,
                        status : doc.status,
                        type : doc.type,
                        postedOn : doc.postedOn
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

router.post("/", checkAuth, (req, res, next) => {
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
                            user : req.body.user,
                            admin: null,
                            teacher: req.body.teacher,
                            type: req.body.type,
                            startDate: req.body.startDate,
                            endDate: req.body.endDate,
                            reason: req.body.reason,
                            postedOn: new Date().toJSON().slice(0, 10),
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
                            user : req.body.user,
                            admin: req.body.admin,
                            teacher: null,
                            type: req.body.type,
                            startDate: req.body.startDate,
                            endDate: req.body.endDate,
                            reason: req.body.reason,
                            postedOn: new Date().toJSON().slice(0, 10),
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
});

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
            Leave.findByIdAndUpdate(req.body.id, {status : "Rejected"}).exec()
                .then(docs => {
                    Teachers.findByIdAndUpdate(docs.teacher, { $inc: { [docs.type]: dateDiffInDays(docs.startDate, docs.endDate) }, $set : {status : "Rejected"} }, { new: true }).exec()
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
            Leave.findByIdAndUpdate(req.body.id,{status : "Rejected"}).exec()
                .then(docs => {
                    Admins.findByIdAndUpdate(docs.admin, { $inc: { [docs.type]: dateDiffInDays(docs.startDate, docs.endDate) }}, { new: true }).exec()
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

router.delete("/", checkAuth, (req, res, next) => {
    if (req.body.user === "teacher") {
        Leave.findByIdAndRemove(req.body.id).exec()
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
    if (req.body.user === "admin") {
        Leave.findByIdAndRemove(req.body.id).exec()
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
});

module.exports = router;