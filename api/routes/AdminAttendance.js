var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var AdminAttendance = require('../models/AdminAttendance');
var checkAuth = require('../middleware/checkAuth');

router.get("/", checkAuth, (req, res) => {
    AdminAttendance.find().populate("admin").exec()
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
    AdminAttendance.findById(req.params.id).populate("admin").exec()
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

router.get("/admins/:adminID", checkAuth, (req, res) => {
    AdminAttendance.find({ admin: req.params.adminID }).exec()
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
        })
});

router.post("/",checkAuth,  (req, res) => {
    const adminAttendance = new AdminAttendance({
        _id: new mongoose.Types.ObjectId(),
        admin: req.body.admin,
        date: req.body.date,
        time: req.body.time,
        status: req.body.status
    });
    adminAttendance.save().then(result => {
        res.status(200).json({
            message: "AdminAttendance Created Successfully",
            createdAdminAttendance: result
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
    var adminAttendances = attendances.map(attendance => {
        return new AdminAttendance({
            _id: new mongoose.Types.ObjectId(),
            admin: attendance.admin,
            date: date,
            time: time,
            status: attendance.status
        })
    }
    );
    AdminAttendance.insertMany(adminAttendances).then(result => {
        res.status(201).json({
            message: "AdminAttendances Created Successfully",
            createdAdminAttendances: result
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
    AdminAttendance.findByIdAndDelete(req.params.id).exec()
        .then(docs => {
            res.status(200).json({
                message: "AdminAttendance Deleted Successfully"
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