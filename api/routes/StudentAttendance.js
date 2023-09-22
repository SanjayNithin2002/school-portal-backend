var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var StudentAttendance = require('../models/StudentAttendance');
var checkAuth = require('../middleware/checkAuth');

/**
 * The function `deleteMultipleRecords` deletes multiple records from a database using an array of
 * updates.
 * 
 * :param updatesArray: The `updatesArray` parameter is an array of objects that contain the updates to
 * be made. Each object in the array represents a record to be deleted and should have a property `_id`
 * which represents the unique identifier of the record to be deleted
 */
async function deleteMultipleRecords(updatesArray) {
    var updatePromises = updatesArray.map(async (update) => {
        try {
            var result = await StudentAttendance.findByIdAndDelete(update);
            return result;
        } catch (error) {
            console.error(`Error deleting document with _id ${update._id}:`, error);
        }
    });

    var results = await Promise.all(updatePromises);
    console.log('Documents deleted successfully:', results);
}

/**
 * The function `updateMultipleRecords` updates multiple records in the `StudentAttendance` collection
 * based on the provided `updatesArray`.
 * 
 * :param updatesArray: An array of objects containing the updates to be made to the records. Each
 * object should have the following properties:
 */
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

/* The code `router.get("/", (req, res) => {...})` is defining a route handler for a GET request to the
root URL ("/"). */
router.get("/", (req, res) => {
    StudentAttendance.find().exec()
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

/* The code `router.get("/:id", (req, res) => {...})` is defining a route handler for a GET request to
the URL "/:id". This route handler is responsible for retrieving a specific student attendance
record from the database based on the provided `id` parameter. */
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

/* The code `router.get("/students/:studentID", (req, res) => {...})` is defining a route handler for a
GET request to the URL "/students/:studentID". This route handler is responsible for retrieving the
attendance records of a specific student from the database based on the provided `studentID`
parameter. */
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

/* The code `router.get("/standard/:standard/section/:section/date/:date/", checkAuth, (req, res) =>
{...})` is defining a route handler for a GET request to the URL
"/standard/:standard/section/:section/date/:date/". */
router.get("/standard/:standard/section/:section/date/:date/", checkAuth, (req, res) => {
    StudentAttendance.find({ date: new Date(req.params.date) }).populate('student').exec()
        .then(docs => {
            var docs = docs.filter(doc => doc.student.standard == req.params.standard && doc.student.section == req.params.section);
            res.status(200).json({
                docs: docs
            })
        })
        .catch(err => {
            ~
            res.status(500).json({
                error: err
            })
        }
        )
});

/* The code `router.get("/date/:date", checkAuth, (req, res) => {...})` is defining a route handler for
a GET request to the URL "/date/:date". This route handler is responsible for retrieving student
attendance records from the database based on the provided `date` parameter. */
router.get("/date/:date", checkAuth, (req, res) => {
    StudentAttendance.find({ date: new Date(req.params.date) }).populate('student').exec()
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

/* The code `router.post("/", (req, res) => {...})` is defining a route handler for a POST request to
the root URL ("/"). */
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

/* The code `router.post("/postmany", checkAuth, (req, res) => {...})` is defining a route handler for
a POST request to the URL "/postmany". This route handler is responsible for creating multiple
student attendance records in the database. */
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

/* The code `router.patch('/patchmany', checkAuth, async (req, res) => {...})` is defining a route
handler for a PATCH request to the URL "/patchmany". This route handler is responsible for updating
multiple student attendance records in the database. */
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

/* The code `router.patch("/deletemany", async (req, res) => {...})` is defining a route handler for a
PATCH request to the URL "/deletemany". This route handler is responsible for deleting multiple
student attendance records from the database. */
router.patch("/deletemany", async (req, res) => {
    try {
        console.log(req.body);
        var results = await deleteMultipleRecords(req.body.deleteArray);
        res.status(200).json({
            message: 'Deleted the student attendances records',
            docs: results,
        });
    } catch (err) {
        res.status(500).json({
            error: err.message || 'Internal server error',
        });
    }
});

/* The code `router.patch("/:id", checkAuth, (req, res) => {...})` is defining a route handler for a
PATCH request to the URL "/:id". This route handler is responsible for updating a specific student
attendance record in the database based on the provided `id` parameter. */
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

/* The code `router.delete("/:id", checkAuth, (req, res) => {...})` is defining a route handler for a
DELETE request to the URL "/:id". This route handler is responsible for deleting a specific student
attendance record from the database based on the provided `id` parameter. */
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