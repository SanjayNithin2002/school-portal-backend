var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var StudentAttendance = require('../models/StudentAttendance');
var checkAuth = require('../middleware/checkAuth');

router.get("/", checkAuth, (req, res) => {
    StudentAttendance.find().populate("student").exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            })
        }
        ).catch(err => {
            res.status(500).json({
                error: err
            })
        }
        )
});

router.get("/:id", checkAuth, (req, res) => {
    StudentAttendance.findById(req.params.id).populate("student").exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            })
        }
        ).catch(err => {
            res.status(500).json({
                error: err
            })
        }
        )
});

router.get("/students/:studentID", checkAuth, (req, res) => {
    StudentAttendance.find({ student: req.params.studentID }).populate("student").exec()
        .then(docs => {
            res.status(200).json({
                docs: docs,
                present: docs.filter(doc => doc.status == "Present").length / 2,
                absent: docs.filter(doc => doc.status == "Absent").length / 2,
                total: docs.length / 2
            })
        }
        ).catch(err => {
            res.status(500).json({
                error: err
            })
        }
        )
});

router.post("/", checkAuth, (req, res) => {
    const studentAttendance = new StudentAttendance({
        _id: new mongoose.Types.ObjectId(),
        student: req.body.student,
        date: req.body.date,
        time: req.body.time,
        status: req.body.status
    });
    studentAttendance.save().then(result => {
        res.status(200).json({
            message: "StudentAttendance Created Successfully",
            createdStudentAttendance: result
        })
    }
    ).catch(err => {
        res.status(500).json({
            error: err
        })
    }
    )
});

router.post("/postmany", checkAuth, (req, res) => {
    var date = req.body.date;
    var time = req.body.time;
    var attendances = req.body.attendances;
    var studentAttendances = attendances.map(attendance => {
        return new StudentAttendance({
            _id: new mongoose.Types.ObjectId(),
            student: attendance.student,
            date: date,
            time: time,
            status: attendance.status
        })
    }
    );
    StudentAttendance.insertMany(studentAttendances).then(result => {
        res.status(200).json({
            message: "Student Attendances Created Successfully",
            createdStudentAttendances: result
        })
    }
    ).catch(err => {    
        res.status(500).json({
            error: err
        })
    }
    )
});

router.delete("/:id", checkAuth, (req, res) => {
    StudentAttendance.findByIdAndDelete(req.params.id).exec()
        .then(docs => {
            res.status(200).json({
                message: "Student Attendance Deleted Successfully",
                docs: docs
            })
        }
        ).catch(err => {
            res.status(500).json({
                error: err
            })
        }
        )
});

module.exports = router;