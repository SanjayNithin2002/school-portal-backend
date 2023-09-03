var mongoose = require('mongoose');
var ClassMessages = require("../models/ClassMessages");
var PersonalMessages = require('../models/PersonalMessages');
var Students = require('../models/Students');
var express = require('express');
var router = express.Router();
var checkAuth = require('../middleware/checkAuth');


router.get("/", checkAuth, (req, res) => {
    ClassMessages.find().populate('postedBy').exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});


router.get("/students/:studentID", checkAuth, (req, res) => {
    Students.findById(req.params.studentID).exec()
        .then(student => {
            var standard = student.standard;
            var section = student.section;
            ClassMessages.find().populate([{ path: "postedBy" }, { path: "class" }]).exec()
                .then(classmessagedocs => {
                    console.log(classmessagedocs);
                    var classMessages = classmessagedocs.filter(doc => {
                        return doc.class.standard == standard && doc.class.section == section;
                    });

                    PersonalMessages.find({ student: req.params.studentID }).populate([{ path: "postedBy" }, { path: "student" }]).exec()
                        .then(docs => {
                            var personalMessages = docs.map(doc => {
                                return {
                                    _id: doc._id,
                                    postedBy: doc.postedBy,
                                    student: doc.student,
                                    message: doc.message,
                                    date: doc.postedOn
                                }
                            });
                            res.status(200).json({
                                docs: personalMessages.concat(classMessages)
                            });
                        })
                        .catch(err => {
                            res.status(500).json({
                                error: err
                            });
                        });
                }).catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});


router.get("/teachers/:teacherID", checkAuth, (req, res) => {
    var teacherID = req.params.teacherID;
    ClassMessages.find({ postedBy: teacherID }).populate([{ path: "postedBy" }, { path: "class" }]).exec()
        .then(classmessagedocs => {
            PersonalMessages.find({ postedBy: req.params.teacherID }).populate([{ path: "postedBy" }, { path: "student" }]).exec()
                .then(docs => {
                    res.status(200).json({
                        docs: docs.concat(classmessagedocs)
                    })
                }).catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});



router.post("/", checkAuth, (req, res) => {
    var classMessages = new ClassMessages({
        _id: new mongoose.Types.ObjectId(),
        class: req.body.class,
        message: req.body.message,
        postedBy: req.body.postedBy,
        postedOn: new Date().toJSON()
    });
    classMessages.save()
        .then(docs => {
            res.status(201).json({
                message: "Class Message Created Successfully",
                docs: docs
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.delete("/:id", checkAuth, (req, res) => {
    ClassMessages.findByIdAndDelete(req.params.id).exec()
        .then(docs => {
            res.status(200).json({
                message: "Class Message Deleted Successfully",
                docs: docs
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
})

module.exports = router;