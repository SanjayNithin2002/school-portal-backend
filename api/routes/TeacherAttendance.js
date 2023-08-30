var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var TeacherAttendance = require('../models/TeacherAttendance');
var checkAuth = require('../middleware/checkAuth');
var multer = require('multer');
var fs = require('fs');
var csv = require('csv-parser');

async function deleteMultipleRecords(updatesArray) {
    var updatePromises = updatesArray.map(async (update) => {
        try {
            var result = await TeacherAttendance.findByIdAndDelete(update);
            return result;
        } catch (error) {
            console.error(`Error deleting document with _id ${update._id}:`, error);
        }
    });

    var results = await Promise.all(updatePromises);
    console.log('Documents deleted successfully:', results);
}

async function updateMultipleRecords(updatesArray) {
    var updatePromises = updatesArray.map(async (update) => {
        try {
            var { _id, ...updateData } = update;
            var result = await TeacherAttendance.updateOne({ _id }, updateData);
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

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./attendances/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname)

    }
});

var fileFilter = (req, file, cb) => {
    //accept
    if (file.mimetype === 'text/csv') {
        cb(null, true);
    }
    //reject
    else {
        cb(null, false);
    }
}

var upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});

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

router.get("/date/:date", checkAuth, (req, res) => {
    TeacherAttendance.find({ date: new Date(req.params.date) }).populate('teacher').exec()
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

router.post("/", checkAuth, (req, res) => {
    var teacherAttendance = new TeacherAttendance({
        _id: new mongoose.Types.ObjectId(),
        teacher: req.body.teacher,
        date: req.body.date,
        time: req.body.time,
        status: req.body.status
    });
    teacherAttendance.save().then(result => {
        res.status(200).json({
            message: "Teacher Attendance Created Successfully",
            docs: result
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

router.post("/fileupload", checkAuth, upload.single("attendances"), (req, res) => {
    var attendances = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => {
            attendances.push(data);
        })
        .on('end', () => {
            console.log('CSV file successfully processed');
            console.log(attendances);
            TeacherAttendance.insertMany(attendances.map(attendance => {
                return {
                    _id: new mongoose.Types.ObjectId(),
                    teacher: attendance.id,
                    status: attendance.Status,
                    date: req.body.date
                }
            }))
                .then(results => {
                    res.status(201).json({
                        message: "Attendance Uploaded Successfully",
                        docs: results
                    });
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });
        });
});

router.patch('/patchmany', checkAuth, async (req, res) => {
    try {
        var results = await updateMultipleRecords(req.body);

        res.status(200).json({
            message: 'Updated the teacher attendances records',
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
    TeacherAttendance.findByIdAndUpdate(req.params.id, updateOps).exec()
        .then(doc => {
            res.status(200).json({
                message: "Teacher Attendance Updated",
                docs: doc
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.delete("/deletemany", async (req, res) => {
    try {
        var results = await deleteMultipleRecords(req.body);
        res.status(200).json({
            message: 'Deleted the admin attendances records',
            docs: results,
        });
    } catch (err) {
        res.status(500).json({
            error: err.message || 'Internal server error',
        });
    }
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