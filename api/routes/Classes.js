var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var timeToString = require('../middleware/timeToString');
var Classes = require('../models/Classes');
var Students = require('../models/Students');
var checkAuth = require('../middleware/checkAuth');

/**
 * The function `updateMultipleRecords` updates multiple records in a MongoDB collection based on an
 * array of updates.
 * @param updatesArray - An array of objects containing the updates to be made to multiple records.
 * Each object in the array should have the following properties:
 */
async function updateMultipleRecords(updatesArray) {
    var updatePromises = updatesArray.map(async (update) => {
        try {
            var { _id, ...updateData } = update;
            var result = await Classes.updateOne({ _id }, updateData);
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

/* This code is defining a GET route for the root URL ("/") of the server. When a GET request is made
to this route, it first checks if the user is authenticated by calling the `checkAuth` middleware
function. If the user is authenticated, it executes the callback function `(req, res, next) =>
{...}`. */
router.get("/", checkAuth, (req, res, next) => {
    Classes.find().populate('teacher').exec()
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

/* This code defines a GET route for the URL "/:id" of the server. When a GET request is made to this
route, it first checks if the user is authenticated by calling the `checkAuth` middleware function.
If the user is authenticated, it executes the callback function `(req, res, next) => {...}`. */
router.get("/:id", checkAuth, (req, res, next) => {
    Classes.findById(req.params.id).populate('teacher').exec()
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

/* The `router.get("/students/:studentID", ...)` route is used to retrieve the classes of a specific
student. */
router.get("/students/:studentID", (req, res, next) => {
    Students.findById(req.params.studentID).exec()
        .then(studDoc => {
            var standard = studDoc.standard;
            var section = studDoc.section;
            Classes.find().populate('teacher').exec()
                .then(docs => {
                    var classes = docs.filter(doc => doc.standard === standard && doc.section === section);
                    res.status(200).json({
                        docs: classes
                    });
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* This code defines a GET route for the URL "/teachers/:teacherID" of the server. When a GET request
is made to this route, it first checks if the user is authenticated by calling the `checkAuth`
middleware function. If the user is authenticated, it executes the callback function `(req, res,
next) => {...}`. */
router.get("/teachers/:teacherID", checkAuth, (req, res, next) => {
    Classes.find({ teacher: req.params.teacherID }).populate('teacher').exec()
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

/* The `router.get("/standard/:standard", ...)` route is used to retrieve information about classes
based on a specific standard. */
router.get("/standard/:standard", (req, res, next) => {
    Students.find({ standard: req.params.standard }).exec()
        .then(studDocs => {
            var sections = studDocs.map(doc => doc.section);
            var uniqueSections = [...new Set(sections)];
            var count = {};
            uniqueSections.forEach(section => {
                count[section] = {
                    male: 0,
                    female: 0
                }
            });
            studDocs.forEach(doc => {
                count[doc.section][doc.gender]++;
            });
            delete count.undefined;
            Classes.find({ standard: req.params.standard }).populate('teacher').exec()
                .then(docs => {
                    var subjects = docs.map(doc => doc.subject);
                    var uniqueSubjects = [...new Set(subjects)];
                    var uniqueSubjects = uniqueSubjects.filter(subject => subject !== "Class Teacher")
                    res.status(200).json({
                        subjects: uniqueSubjects,
                        sections: uniqueSections.filter(section => section !== undefined),
                        count: count
                    })
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The code block you provided is defining a POST route for the root URL ("/") of the server. When a
POST request is made to this route, it first checks if the user is authenticated by calling the
`checkAuth` middleware function. If the user is authenticated, it executes the callback function
`(req, res, next) => {...}`. */
router.post("/", checkAuth, (req, res, next) => {
    var classes = new Classes({
        _id: new mongoose.Types.ObjectId(),
        teacher: req.body.teacher,
        standard: req.body.standard,
        section: req.body.section,
        subject: req.body.subject,
        timings: req.body.timings ? req.body.timings.map(timing => {
            return {
                startTime: timeToString(timing.startTime),
                endTime: timeToString(timing.endTime),
                day: timing.day
            }
        }) : []
    });
    classes.save()
        .then(docs => {
            res.status(201).json({
                message: "Class Created Successfully",
                docs: docs
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The `router.post("/postmany", checkAuth, (req, res) => {...})` route is used to create multiple
class records at once. */
router.post("/postmany", checkAuth, (req, res) => {
    var classes = req.body.map(classrec => {
        return new Classes({
            _id: new mongoose.Types.ObjectId(),
            teacher: classrec.teacher,
            standard: classrec.standard,
            section: classrec.section,
            subject: classrec.subject,
            timings: classrec.timings ? classrec.timings.map(timing => {
                return {
                    startTime: timeToString(timing.startTime),
                    endTime: timeToString(timing.endTime),
                    day: timing.day
                }
            }) : []
        })
    });

    Classes.insertMany(classes)
        .then(docs => {
            res.status(200).json({
                message: "Classes Created Successfully",
                docs: docs
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The `router.patch('/patchmany', checkAuth, async (req, res) => {...})` route is used to update
multiple class records at once. */
router.patch('/patchmany', checkAuth, async (req, res) => {
    try {
        var results = await updateMultipleRecords(req.body);

        res.status(200).json({
            message: 'Updated the classes records',
            docs: results,
        });
    } catch (err) {
        res.status(500).json({
            error: err.message || 'Internal server error',
        });
    }
});

/* The code `router.patch("/:id", checkAuth, (req, res) => {...})` defines a PATCH route for the URL
"/:id" of the server. When a PATCH request is made to this route, it first checks if the user is
authenticated by calling the `checkAuth` middleware function. If the user is authenticated, it
executes the callback function `(req, res) => {...}`. */
router.patch("/:id", checkAuth, (req, res) => {
    console.log("NO");
    var id = req.params.id;
    var updateOps = {};
    for (var ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Classes.findByIdAndUpdate(id, updateOps).exec()
        .then(docs => {
            res.status(200).json({
                message: "Class Updated Successfully",
                docs: docs
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});

/* The code `router.delete("/:id", (req, res) => {...})` defines a DELETE route for the URL "/:id" of
the server. When a DELETE request is made to this route, it executes the callback function `(req,
res) => {...}`. */
router.delete("/:id", (req, res) => {
    Classes.findByIdAndDelete(req.params.id).exec()
        .then(docs => {
            res.status(200).json({
                message: "Class record deleted successfully",
                docs: docs
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

module.exports = router;