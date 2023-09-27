var mongoose = require('mongoose');
var express = require('express');
var Exams = require('../models/Exams');
var Students = require('../models/Students');
var Classes = require('../models/Classes');
var timeToString = require('../middleware/timeToString');
var router = express.Router();
var checkAuth = require('../middleware/checkAuth');


/**
 * The function `updateMultipleRecords` updates multiple records in a MongoDB collection based on an
 * array of updates.
 * 
 * :param updatesArray: The `updatesArray` parameter is an array of objects. Each object represents an
 * update operation for a document in the `Exams` collection. The objects in the array should have the
 * following structure:
 */
async function updateMultipleRecords(updatesArray) {
    var updatePromises = updatesArray.map(async (update) => {
        try {
            var { _id, ...updateData } = update;
            var result = await Exams.updateOne({ _id }, updateData);
            return result;
        } catch (error) {
            console.error(`Error updating document with _id ${update._id}:`, error);
        }
    });

    var results = await Promise.all(updatePromises);
    console.log('Documents updated successfully:', results);
}

/**
 * The function `deleteMultipleRecords` deletes multiple records from a database using an array of
 * updates.
 * 
 * :param updatesArray: The `updatesArray` parameter is an array of objects that contain the updates to
 * be deleted. Each object in the array represents a document in the database and should have an `_id`
 * property that specifies the unique identifier of the document to be deleted
 */
async function deleteMultipleRecords(updatesArray) {
    var updatePromises = updatesArray.map(async (update) => {
        try {
            var result = await Exams.findByIdAndDelete(update);
            return result;
        } catch (error) {
            console.error(`Error deleting document with _id ${update._id}:`, error);
        }
    });

    var results = await Promise.all(updatePromises);
    console.log('Documents deleted successfully:', results);
}

/* This code is defining a GET route for the root URL ("/") of the server. When a GET request is made
to this route, it will execute the callback function. */
router.get("/", checkAuth, (req, res) => {
    Exams.find().populate('class').exec()
        .then(docs => {
            console.log(docs)
            res.status(200).json({
                docs: docs.map(doc => {
                    return {
                        _id: doc._id,
                        date: doc.date,
                        startTime: timeToString(doc.startTime),
                        endTime: timeToString(doc.endTime),
                        maxMarks: doc.maxMarks,
                        //weightageMarks: doc.weightageMarks,
                        //examName: doc.examName,
                        subject: doc.class.subject,
                        standard: doc.class.standard,
                        section: doc.class.section
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

/* This code defines a GET route for the "/students/:studentID" URL of the server. When a GET request
is made to this route, it will execute the callback function. */
router.get("/students/:studentID", checkAuth, (req, res) => {
    Students.findById(req.params.studentID).exec()
        .then(studDoc => {
            var standard = studDoc.standard;
            var section = studDoc.section;
            Exams.find().populate('class').exec()
                .then(docs => {
                    var exams = docs.filter(doc => {
                        return doc.class.standard === standard && doc.class.section === section
                    });
                    var exams = exams.map(doc => {
                        return {
                            _id: doc._id,
                            date: doc.date,
                            startTime: doc.startTime,
                            endTime: doc.endTime,
                            maxMarks: doc.maxMarks,
                            weightageMarks: doc.weightageMarks,
                            examName: doc.examName,
                            subject: doc.class.subject,
                            standard: doc.class.standard,
                            section: doc.class.section
                        }
                    });
                    res.status(200).json({
                        docs: exams
                    });
                }).catch(err => {
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

/* This code defines a GET route for the "/standard/:standard" URL of the server. When a GET request is
made to this route, it will execute the callback function. */
router.get("/standard/:standard", checkAuth, (req, res) => {
    Exams.find().populate('class').exec()
        .then(docs => {
            var docs = docs.filter(doc => doc.class.standard == req.params.standard);
            res.status(200).json({
                docs: docs
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* This code defines a GET route for the "/teachers/:id" URL of the server. When a GET request is made
to this route, it will execute the callback function. */
router.get('/teachers/:id', checkAuth, (req, res) => {
    Exams.find().populate('class').exec()
        .then(docs => {
            var docs = docs.filter(doc => doc.class.teacher == req.params.id && doc.class.teacher != null);
            res.status(200).json({
                docs: docs
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The code you provided is defining a POST route for the root URL ("/") of the server. When a POST
request is made to this route, it will execute the callback function. */
router.post("/", checkAuth, (req, res) => {
    var exam = new Exams({
        _id: new mongoose.Types.ObjectId(),
        class: req.body.class,
        date: req.body.date,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        maxMarks: req.body.maxMarks,
        weightageMarks: req.body.weightageMarks ? req.body.weightageMarks : req.body.maxMarks,
        examName: req.body.examName
    });
    exam.save()
        .then(doc => {
            res.status(201).json({
                message: "Exam Posted Successfully",
                docs: doc
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The `router.post("/postmany", checkAuth, (req, res) => { ... })` code is defining a POST route for
the "/postmany" URL of the server. When a POST request is made to this route, it will execute the
callback function. */
router.post("/postmany", checkAuth, (req, res) => {
    var exams = req.body;
    var exams = exams.map(exam => {
        return {
            _id: new mongoose.Types.ObjectId(),
            class: exam.class,
            date: exam.date,
            startTime: exam.startTime,
            endTime: exam.endTime,
            maxMarks: exam.maxMarks,
            weightageMarks: exam.weightageMarks ? exam.weightageMarks : exam.maxMarks,
            examName: exam.examName
        }
    });
    Exams.insertMany(exams)
        .then(docs => {
            res.status(201).json({
                message: "Exam Records Posted Successfully",
                docs: docs
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The `router.patch('/patchmany', checkAuth, async (req, res) => { ... })` code is defining a PATCH
route for the "/patchmany" URL of the server. When a PATCH request is made to this route, it will
execute the callback function. */
router.patch('/patchmany', checkAuth, async (req, res) => {
    try {
        var results = await updateMultipleRecords(req.body);

        res.status(200).json({
            message: 'Updated the Exams records',
            docs: results,
        });
    } catch (err) {
        res.status(500).json({
            error: err.message || 'Internal server error',
        });
    }
});

/* The `router.patch("/deletemany", async (req, res) => { ... })` code is defining a PATCH route for
the "/deletemany" URL of the server. When a PATCH request is made to this route, it will execute the
callback function. */
router.patch("/deletemany", async (req, res) => {
    try {
        var results = await deleteMultipleRecords(req.body);
        res.status(200).json({
            message: 'Deleted the Exams records',
            docs: results,
        });
    } catch (err) {
        res.status(500).json({
            error: err.message || 'Internal server error',
        });
    }
});

/* The `router.patch("/:id", checkAuth, (req, res) => { ... })` code is defining a PATCH route for the
"/:id" URL of the server. When a PATCH request is made to this route, it will execute the callback
function. */
router.patch("/:id", checkAuth, (req, res) => {
    var updateOps = {};
    for (var ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Exams.findByIdAndUpdate(req.params.id, updateOps).exec()
        .then(doc => {
            res.status(200).json({
                message: "Exam Updated",
                docs: doc
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The `router.delete("/:id", checkAuth, (req, res) => { ... })` code is defining a DELETE route for
the "/:id" URL of the server. When a DELETE request is made to this route, it will execute the
callback function. */
router.delete("/:id", checkAuth, (req, res) => {
    Exams.findByIdAndDelete(req.params.id).exec()
        .then(doc => {
            res.status(201).json({
                message: "Exam Deleted Successfully",
                docs: doc
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});
module.exports = router;