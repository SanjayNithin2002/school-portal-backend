var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var StudentAttendance = require('../models/StudentAttendance');
var checkAuth = require('../middleware/checkAuth');

async function updateMultipleRecords(updatesArray) {
    var updatePromises = updatesArray.map(async (update) => {
        try {
            var { _id, ...updateData } = update;
            var result = await StudentAttendance.updateOne({ _id }, updateData);
            return result;
        } catch (error) {
            res.status(500).json({
                error: err
            });
            console.error(`Error updating document with _id ${update._id}:`, error);
        }
    });

    var results = await Promise.all(updatePromises);
    console.log('Documents updated successfully:', results);
}

router.get("/", (req, res) => {
    (async () => {
        try {
            var results = await StudentAttendance.aggregate([
                {
                    $group: {
                        _id: {
                            student: '$student',
                            date: '$date'
                        },
                        count: {
                            $sum: {
                                $cond: [
                                    {
                                        $or: [
                                            { $eq: ['$status', 'Present'] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]);
            res.status(200).json({
                docs: results.map(result => {
                    return {
                        student: result._id.student,
                        date: new Date(result._id.date).toISOString().split('T')[0],
                        count: result.count
                    }
                })
            })
        } catch (err) {
            res.status(500).json({
                error: err
            })
        }
    })();

});

router.get("/:id", (req, res) => {
    StudentAttendance.findById(req.params.id).exec()
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

router.get("/students/:studentID", (req, res) => {
    (async () => {
        try {
            var results = await StudentAttendance.aggregate([
                {
                    $group: {
                        _id: {
                            student: '$student',
                            date: '$date'
                        },
                        count: {
                            $sum: {
                                $cond: [
                                    {
                                        $or: [
                                            { $eq: ['$status', 'Present'] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]);
            var docs = results.filter(result => result._id.student == req.params.studentID);
            res.status(200).json({
                docs: docs.map(doc => {
                    return {
                        student: doc._id.student,
                        date: new Date(doc._id.date).toISOString().split('T')[0],
                        count: doc.count
                    }
                })
            })
        } catch (err) {
            res.status(500).json({
                error: err
            })
        }
    })();
});

router.get("/standard/:standard/section/:section/date/:date/", checkAuth, (req, res) => {
    StudentAttendance.find({date : new Date(req.params.date)}).populate('student').exec()
        .then(docs => {
            var docs = docs.filter(doc => doc.student.standard == req.params.standard && doc.student.section == req.params.section );
            res.status(200).json({
                docs : docs
            })
        })
        .catch(err => {~
            res.status(500).json({
                error: err
            })
        }
        )
});


router.post("/", (req, res) => {
    var studentAttendance = new StudentAttendance({
        _id: new mongoose.Types.ObjectId(),
        student: req.body.student,
        date: req.body.date,
        time: req.body.time,
        status: req.body.status
    });
    studentAttendance.save().then(result => {
        res.status(200).json({
            message: "StudentAttendance Created Successfully",
            docs: result
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
            docs: result
        })
    }
    ).catch(err => {
        res.status(500).json({
            error: err
        })
    }
    )
});

router.patch('/patchmany', checkAuth, async (req, res) => {
    try {
        var results = await updateMultipleRecords(req.body);

        res.status(200).json({
            message: 'Updated the student attendances records',
            docs: results,
        });
    } catch (err) {
        res.status(500).json({
            error: err.message || 'Internal server error',
        });
    }
});

router.patch("/:id", checkAuth, (req, res) => {
    var updateOps = {};
    for (var ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    StudentAttendance.findByIdAndUpdate(req.params.id, updateOps).exec()
        .then(doc => {
            res.status(200).json({
                message: "Student Attendance Updated",
                docs: doc
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
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