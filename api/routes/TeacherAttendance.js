var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var TeacherAttendance = require('../models/TeacherAttendance');
var checkAuth = require('../middleware/checkAuth');
var multer = require('multer');
var fs = require('fs');
var csv = require('csv-parser');

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
            var result = await TeacherAttendance.findByIdAndDelete(update);
            return result;
        } catch (error) {
            console.error(`Error deleting document with _id ${update._id}:`, error);
        }
    });

    var results = await Promise.all(updatePromises);
    console.log('Documents deleted successfully:', results);
}

/**
 * The function `updateMultipleRecords` updates multiple records in the TeacherAttendance collection in
 * a MongoDB database.
 * 
 * :param updatesArray: An array of objects containing the updates to be made to the TeacherAttendance
 * collection. Each object should have the following structure:
 */
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

/* The code `var storage = multer.diskStorage({ ... })` is configuring the storage options for multer,
a middleware used for handling file uploads in Node.js. */
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./attendances/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname)

    }
});

/* The `fileFilter` function is used as a filter for the uploaded files. It checks the `mimetype`
property of the file object to determine if the file is a CSV file. If the mimetype is `'text/csv'`,
it calls the callback function `cb` with `null` as the first argument (indicating no error) and
`true` as the second argument (indicating that the file should be accepted). If the mimetype is not
`'text/csv'`, it calls the callback function with `null` as the first argument and `false` as the
second argument (indicating that the file should be rejected). */
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

/* The code `var upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 10 },
fileFilter: fileFilter });` is configuring the multer middleware for handling file uploads in
Node.js. */
var upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});

/* This code is defining a GET route for the root URL ("/") of the server. When a GET request is made
to this route, it will execute the callback function `(req, res) => { ... }`. */
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

/* This code defines a GET route for the URL "/:id" of the server. When a GET request is made to this
route, it executes the callback function `(req, res) => { ... }`. */
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

/* The code `router.get("/teachers/:teacherID", checkAuth, (req, res) => { ... })` defines a GET route
for the URL "/teachers/:teacherID" of the server. */
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

/* The code `router.get("/date/:date", checkAuth, (req, res) => { ... })` defines a GET route for the
URL "/date/:date" of the server. */
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

/* The code `router.post("/", checkAuth, (req, res) => { ... })` is defining a POST route for the root
URL ("/") of the server. When a POST request is made to this route, it executes the callback
function `(req, res) => { ... }`. */
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

/* The `router.post("/postmany", checkAuth, (req, res) => { ... })` function is defining a POST route
for the URL "/postmany" of the server. */
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

/* The code `router.post("/fileupload", checkAuth, upload.single("attendances"), (req, res) => { ...
})` defines a POST route for the URL "/fileupload" of the server. */
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

/* The code `router.patch('/patchmany', checkAuth, async (req, res) => { ... })` defines a PATCH route
for the URL "/patchmany" of the server. When a PATCH request is made to this route, it executes the
callback function `(req, res) => { ... }`. */
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

/* The code `router.patch("/deletemany", async (req, res) => { ... })` defines a PATCH route for the
URL "/deletemany" of the server. When a PATCH request is made to this route, it executes the
callback function `(req, res) => { ... }`. */
router.patch("/deletemany", async (req, res) => {
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

/* The code `router.patch("/:id", checkAuth, (req, res) => { ... })` defines a PATCH route for the URL
"/:id" of the server. When a PATCH request is made to this route, it executes the callback function
`(req, res) => { ... }`. */
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

/* The code `router.delete("/:id", checkAuth, (req, res) => { ... })` is defining a DELETE route for
the URL "/:id" of the server. When a DELETE request is made to this route, it executes the callback
function `(req, res) => { ... }`. */
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