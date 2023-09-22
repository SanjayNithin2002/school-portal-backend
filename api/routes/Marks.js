var mongoose = require('mongoose');
var Marks = require('../models/Marks');
var Assessments = require('../models/Assessments');
var express = require('express');
var multer = require('multer');
var fs = require('fs');
var csv = require('csv-parser');
var router = express.Router();
var checkAuth = require('../middleware/checkAuth');
var Exams = require('../models/Exams');

/* The above code is configuring the storage options for handling file uploads using the multer library
in JavaScript. It sets the destination folder for storing the uploaded files to "./marks/" and
generates a unique filename for each uploaded file using the current timestamp and the original
filename. */
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./marks/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname)

    }
});

/* The above code is a JavaScript function called `fileFilter` that is used as a filter for accepting
or rejecting files based on their mimetype. */
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

/* The above code is configuring the multer middleware in a Node.js application. Multer is a middleware
used for handling file uploads in Node.js. */
var upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});

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
            var result = await Marks.updateOne({ _id }, updateData);
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

/* The above code is defining a route handler for a GET request to the root URL ("/"). It uses the
`checkAuth` middleware function to authenticate the request. */
router.get("/", checkAuth, (req, res) => {
    Marks.find().populate([{ path: "assessment", populate: { path: "class" } }, { path: "exam", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(docs => {
            var assessmentMarks = docs.filter(doc => doc.assessment != null);
            var examMarks = docs.filter(doc => doc.exam != null);
            res.status(200).json({
                docs: {
                    assessmentMarks: assessmentMarks,
                    examMarks: examMarks
                }
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The above code is defining a route handler for a GET request with a dynamic parameter ":id". It is
using the "checkAuth" middleware function to authenticate the request. */
router.get("/:id", checkAuth, (req, res) => {
    Marks.findById(req.params.id).populate([{ path: "assessment", populate: { path: "class" } }, { path: "exam", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(doc => {
            res.status(200).json({
                docs: doc
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The above code is defining a route handler for GET requests to "/students/:studentID". It first
checks for authentication using the "checkAuth" middleware. */
router.get("/students/:studentID", checkAuth, (req, res) => {
    Marks.find({ student: req.params.studentID }).populate([{ path: "assessment", populate: { path: "class" } }, { path: "exam", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(docs => {
            var assessmentMarks = docs.filter(doc => doc.assessment != null);
            var examMarks = docs.filter(doc => doc.exam != null);
            res.status(200).json({
                docs: {
                    assessmentMarks: assessmentMarks,
                    examMarks: examMarks
                }
            });
        }
        )
        .catch(err => {
            res.status(500).json({
                error: err
            })
        }
        );
});

/* The above code is defining a route in a JavaScript router that handles a GET request to
"/teachers/:teacherID". It first checks if the user is authenticated using the "checkAuth"
middleware. */
router.get("/teachers/:teacherID", checkAuth, (req, res) => {
    var teacherID = req.params.teacherID;
    Marks.find().populate([{ path: "assessment", populate: { path: "class" } }, { path: "exam", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(docs => {
            var assessmentMarks = docs.filter(doc => doc.assessment != null && doc.assessment.class.teacher == teacherID);
            var examMarks = docs.filter(doc => doc.exam != null && doc.exam.class.teacher == teacherID);
            res.status(200).json({
                docs: {
                    assessmentMarks: assessmentMarks,
                    examMarks: examMarks
                }
            });
        }
        )
        .catch(err => {
            res.status(500).json({
                error: err
            })
        }
        );
});

/* The above code is defining a route for retrieving marks for a specific assessment. It is using the
GET method and the route is "/assessments/:assessmentID", where ":assessmentID" is a parameter that
represents the ID of the assessment. */
router.get("/assessments/:assessmentID", checkAuth, (req, res) => {
    Marks.find({ assessment: req.params.assessmentID }).populate([{ path: "assessment", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            });
        }
        )
        .catch(err => {
            res.status(500).json({
                error: err
            })
        }
        );
});

/* The above code is defining a route for GET requests to "/exams/:examID". It uses the checkAuth
middleware to authenticate the request. */
router.get("/exams/:examID", checkAuth, (req, res) => {
    Marks.find({ exam: req.params.examID }).populate([{ path: "exam", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            });
        }
        )
        .catch(err => {
            res.status(500).json({
                error: err
            })
        }
        );
});

/* The above code is defining a route handler for a GET request to "/classes/:id". When this route is
accessed, it will query the database for all documents in the "Marks" collection and populate the
"assessment", "exam", and "student" fields. It then filters the documents to find assessment marks
and exam marks that belong to the specified class ID. Finally, it sends a JSON response with the
filtered assessment marks and exam marks. If there is an error during the process, it sends a JSON
response with the error message. */
router.get("/classes/:id", (req, res) => {
    Marks.find().populate([{ path: "assessment"}, { path: "exam" }, { path: "student" }]).exec()
        .then(docs => {
            console.log(docs)
            var assessmentMarks = docs.filter(doc => doc.assessment != null && doc.assessment.class == req.params.id);
            var examMarks = docs.filter(doc => doc.exam != null && doc.exam.class == req.params.id);
            console.log(assessmentMarks);
            console.log(examMarks);
            res.status(200).json({
                docs: {
                    assessmentMarks: assessmentMarks,
                    examMarks: examMarks
                }
            });
        }
        )
        .catch(err => {
            res.status(500).json({
                error: err
            })
        }
        );
});

/* The above code is a route handler for a POST request. It is checking the authentication of the user
before proceeding with the code execution. */
router.post("/", checkAuth, (req, res) => {
    if (req.body.type === "assessment") {
        Assessments.findById(req.body.assessment).exec()
            .then(doc => {
                var maxMarks = doc.maxMarks;
                var weightageMarks = doc.weightageMarks;
                var scoredMarks = req.body.scoredMarks;
                var weightageScoredMarks = (scoredMarks / maxMarks) * weightageMarks;
                var mark = new Marks({
                    _id: new mongoose.Types.ObjectId(),
                    student: req.body.student,
                    [req.body.type]: req.body[req.body.type],
                    scoredMarks: scoredMarks,
                    weightageScoredMarks: weightageScoredMarks,
                    remarks: req.body.remarks
                });
                mark.save()
                    .then(result => {
                        res.status(201).json({
                            message: "Mark Saved Successfully",
                            docs: result
                        });
                    }
                    )
                    .catch(err => {
                        res.status(500).json({
                            error: err
                        })
                    }
                    );
            })
    }
    if (req.body.type === "exam") {
        Exams.findById(req.body.exam).exec()
            .then(doc => {
                var maxMarks = doc.maxMarks;
                var weightageMarks = doc.weightageMarks;
                var scoredMarks = req.body.scoredMarks;
                var weightageScoredMarks = (scoredMarks / maxMarks) * weightageMarks;
                var mark = new Marks({
                    _id: new mongoose.Types.ObjectId(),
                    student: req.body.student,
                    [req.body.type]: req.body[req.body.type],
                    scoredMarks: scoredMarks,
                    weightageScoredMarks: weightageScoredMarks,
                    remarks: req.body.remarks
                });
                mark.save()
                    .then(result => {
                        res.status(201).json({
                            message: "Mark Saved Successfully",
                            docs: result
                        });
                    }
                    )
                    .catch(err => {
                        res.status(500).json({
                            error: err
                        })
                    }
                    );
            })
    }
});

/* The above code is a route handler for a POST request to upload a CSV file and save marks for
multiple students. It first checks if the type of assessment is "assessment" or "exam" based on the
request body. */
router.post("/postmany/fileupload", checkAuth, upload.single("marks"), (req, res) => {
    //receive student array and perform insert many operation
    if (req.body.type === "assessment") {
        Assessments.findById(req.body.assessment).exec()
            .then(doc => {
                var marks = [];
                var maxMarks = doc.maxMarks;
                var weightageMarks = doc.weightageMarks;
                fs.createReadStream(req.file.path)
                    .pipe(csv())
                    .on('data', (data) => {


                        marks.push(data);
                    })
                    .on('end', () => {
                        console.log('CSV file successfully processed');
                        console.log(marks);
                        Marks.insertMany(marks.map(mark => {
                            return {
                                _id: new mongoose.Types.ObjectId(),
                                student: mark.id,
                                [req.body.type]: req.body[req.body.type],
                                scoredMarks: mark.scoredMarks,
                                weightageScoredMarks: (mark.scoredMarks / maxMarks) * weightageMarks,
                                remarks: mark.Remarks
                            }
                        }))
                            .then(results => {
                                res.status(201).json({
                                    message: "Marks Saved Successfully",
                                    docs: results
                                });
                            })
                            .catch(err => {
                                res.status(500).json({
                                    error: err
                                })
                            });
                    });
            }).catch(err => {
                res.status(500).json({
                    error: err
                })
            });
    }
    if (req.body.type === "exam") {
        Exams.findById(req.body.exam).exec()
            .then(doc => {
                var marks = [];
                var maxMarks = doc.maxMarks;
                var weightageMarks = doc.weightageMarks;
                fs.createReadStream(req.file.path)
                    .pipe(csv())
                    .on('data', (data) => {
                        marks.push(data);
                    })
                    .on('end', () => {
                        console.log('CSV file successfully processed');
                        console.log(marks);
                        Marks.insertMany(marks.map(mark => {
                            return {
                                _id: new mongoose.Types.ObjectId(),
                                student: mark.id,
                                [req.body.type]: req.body[req.body.type],
                                scoredMarks: mark.scoredMarks,
                                weightageScoredMarks: (mark.scoredMarks / maxMarks) * weightageMarks,
                                remarks: mark.Remarks
                            }
                        }))
                            .then(results => {
                                res.status(201).json({
                                    message: "Marks Saved Successfully",
                                    docs: results
                                });
                            })
                            .catch(err => {
                                res.status(500).json({
                                    error: err
                                })
                            });
                    });
            }).catch(err => {
                res.status(500).json({
                    error: err
                })
            });
    }
});

/* The above code is defining a route handler for a POST request to "/postmany". It first checks if the
request body has a property "type" with the value "assessment". If it does, it finds an assessment
document in the database based on the assessment ID provided in the request body. It then filters
the "marks" array in the request body to remove any marks with an empty "scoredMarks" property. It
retrieves the maximum marks and weightage marks from the assessment document. It then uses the Marks
model to insert multiple documents into the database, based on the filtered marks array. */
router.post("/postmany", checkAuth, (req, res) => {
    if (req.body.type === "assessment") {
        Assessments.findById(req.body.assessment).exec()
            .then(doc => {
                const marks = req.body.marks.filter(mark => mark.scoredMarks != "");
                var maxMarks = doc.maxMarks;
                var weightageMarks = doc.weightageMarks;
                Marks.insertMany(marks.map(mark => {
                    return {
                        _id: new mongoose.Types.ObjectId(),
                        student: mark.student,
                        [req.body.type]: req.body[req.body.type],
                        scoredMarks: mark.scoredMarks,
                        weightageScoredMarks: (mark.scoredMarks / maxMarks) * weightageMarks,
                        remarks: mark.remarks
                    }
                }))
                    .then(results => {
                        res.status(201).json({
                            message: "Marks Saved Successfully",
                            docs: results
                        });
                    })
                    .catch(err => {
                        res.status(500).json({
                            error: err
                        })
                    });
            });
    }
    if (req.body.type === "exam") {
        Exams.findById(req.body.exam).exec()
            .then(doc => {
                const marks = req.body.marks.filter(mark => mark.scoredMarks != "");
                var maxMarks = doc.maxMarks;
                var weightageMarks = doc.weightageMarks;
                Marks.insertMany(marks.map(mark => {
                    return {
                        _id: new mongoose.Types.ObjectId(),
                        student: mark.student,
                        [req.body.type]: req.body[req.body.type],
                        scoredMarks: mark.scoredMarks,
                        weightageScoredMarks: (mark.scoredMarks / maxMarks) * weightageMarks,
                        remarks: mark.remarks
                    }
                }))
                    .then(results => {
                        res.status(201).json({
                            message: "Marks Saved Successfully",
                            docs: results
                        });
                    })
                    .catch(err => {
                        res.status(500).json({
                            error: err
                        })
                    });
            });
    }
});

/* The above code is defining a PATCH route handler for the '/patchmany' endpoint. When a PATCH request
is made to this endpoint, it will execute the `updateMultipleRecords` function with the request body
as an argument. The function is expected to update multiple records based on the provided data. */
router.patch('/patchmany', async (req, res) => {
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

/* The above code is defining a PATCH route for updating a document in a MongoDB collection called
"Marks". It is using the Express router to handle the route. The route expects an ID parameter in
the URL and requires authentication using the "checkAuth" middleware. */
router.patch("/:id", checkAuth, (req, res) => {
    var updateOps = {};
    for (var ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Marks.findByIdAndUpdate(req.params.id, updateOps).exec()
        .then(doc => {
            res.status(200).json({
                message: "Marks Updated",
                docs: doc
            })

        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The above code is defining a DELETE route for a router. The route is specified as "/:id", which
means it expects an id parameter in the URL. The code also includes a middleware function called
"checkAuth" which is used to authenticate the request. */
router.delete("/:id", checkAuth, (req, res) => {
    Marks.findByIdAndDelete(req.params.id).exec()
        .then(doc => {
            res.status(200).json({
                message: "Mark Deleted Successfully",
                docs: doc
            });
        }
        )
        .catch(err => {
            res.status(500).json({
                error: err
            })
        }
        );
});

module.exports = router;