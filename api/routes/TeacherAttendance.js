var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var TeacherAttendance = require('../models/TeacherAttendance');
var checkAuth = require('../middleware/checkAuth');

router.get("/", checkAuth, (req, res) => {
    TeacherAttendance.find().populate("teacher").exec()
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
    TeacherAttendance.findById(req.params.id).populate("teacher").exec()
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

router.get("/teachers/:teacherID", checkAuth, (req, res) => {
    TeacherAttendance.find({ teacher: req.params.teacherID }).exec()
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

router.post("/", checkAuth, (req, res) => {
    const teacherAttendance = new TeacherAttendance({
        _id: new mongoose.Types.ObjectId(),
        teacher: req.body.teacher,
        date: req.body.date,
        time: req.body.time,
        status: req.body.status
    });
    teacherAttendance.save().then(result => {
        res.status(200).json({
            message: "Teacher Attendance Created Successfully",
            createdTeacherAttendance: result
        })
    }).catch(err => {
        res.status(500).json({
            error: err
        })
    })

});

router.post("/postmany", checkAuth, (req, res) => {
    var date = req.body.date;
    var time = req.body.time;
    var attendances = req.body.attendances;
    var teacherAttendances = attendances.map(attendance => {
        return new TeacherAttendance({
            _id: new mongoose.Types.ObjectId(),
            teacher: attendance.teacher,
            date: date,
            time: time,
            status: attendance.status
        })
    }
    );
    TeacherAttendance.insertMany(teacherAttendances).then(result => {
        res.status(200).json({
            message: "TeacherAttendances Created Successfully",
            createdTeacherAttendances: result
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
    TeacherAttendance.findByIdAndDelete(req.params.id).exec()
        .then(docs => {
            res.status(200).json({
                message: "TeacherAttendance Deleted Successfully",
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