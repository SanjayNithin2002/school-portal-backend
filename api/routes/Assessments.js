var mongoose = require('mongoose');
var express = require('express');
var multer = require('multer');
var admin = require("firebase-admin");
var Students = require('../models/Students');
var Assessments = require('../models/Assessments');
var Exams = require('../models/Exams');
var Answers = require('../models/Answers');
var checkAuth = require('../middleware/checkAuth');
var makeUrlFriendly = require('../middleware/makeUrlFriendly');
var timeToString = require('../middleware/timeToString');
var router = express.Router();

/* The following code is configuring the storage options for file uploads using the multer library in
JavaScript. It sets the destination folder for uploaded files to "./assessments/" and generates a
unique filename for each uploaded file using the current timestamp and the original filename. */
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./assessments/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname)

    }
});

/* The following code is a JavaScript function called `fileFilter` that is used as a filter for accepting
or rejecting files based on their mimetype. */
var fileFilter = (req, file, cb) => {
    //accept
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    }
    //reject
    else {
        cb(null, false);
    }
}

/* The following code is configuring the multer middleware in a Node.js application. Multer is a middleware
used for handling file uploads in Node.js. */
var upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});

/* The following code is defining a JavaScript object called `serviceAccount`. This object contains various
properties that are used for authentication and authorization purposes when interacting with Google
APIs. The values for these properties are being retrieved from environment variables using
`process.env`. The `private_key` property is being modified by replacing any occurrences of `\n`
with actual newline characters `\n`. */
var serviceAccount = {
    type: process.env.type,
    project_id: process.env.project_id,
    private_key_id: process.env.private_key_id,
    private_key: process.env.private_key.replace(/\\n/g, '\n'),
    client_email: process.env.client_email,
    client_id: process.env.client_id,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.client_x509_cert_url,
    universe_domain: "googleapis.com"
}

/* The following code is initializing the Firebase Admin SDK in a JavaScript environment. It is using the
`admin.initializeApp()` method to configure the SDK with the necessary credentials and storage
bucket URL. The `credential` parameter is used to provide the service account credentials, and the
`storageBucket` parameter is used to specify the URL of the Firebase Storage bucket. The SDK is
being initialized with the name "assessments". */
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.BUCKET_URL
}, "assessments");

/* The following code is creating a variable named "bucket" and assigning it the value of the storage
bucket object from the admin module. */
var bucket = admin.storage().bucket();

/* The following code is defining a route handler for a GET request to the root URL ("/"). It uses the
`checkAuth` middleware function to authenticate the request. */
router.get("/", checkAuth, (req, res) => {
    Assessments.find().populate("class").exec()
        .then(docs => {
            var assessments = docs.map(doc => {
                return {
                    _id: doc._id,
                    maxMarks: doc.maxMarks,
                    weightageMarks: doc.weightageMarks,
                    postedOn: doc.postedOn,
                    lastDate: doc.lastDate,
                    title: doc.title,
                    description: doc.description,
                    questionPaper: process.env.url + "/downloadfile/" + doc.questionPaper.split("\\").join("/"),
                    class: doc.class
                }
            });
            res.status(200).json({
                docs: assessments
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The following code is defining a route in a JavaScript router that handles a GET request to
"/students/:studentID". It first checks for authentication using the "checkAuth" middleware. */
router.get("/students/:studentID", checkAuth, (req, res) => {
    Students.findById(req.params.studentID).exec()
        .then(studDoc => {
            var standard = studDoc.standard;
            var section = studDoc.section;
            Assessments.find().populate('class').exec()
                .then(docs => {
                    var assessments = docs.filter(doc => doc.class ? doc.class.standard == standard && doc.class.section == section : false);
                    var assessments = assessments.map(doc => {
                        return {
                            _id: doc._id,
                            maxMarks: doc.maxMarks,
                            weightageMarks: doc.weightageMarks,
                            postedOn: doc.postedOn,
                            lastDate: doc.lastDate,
                            title: doc.title,
                            description: doc.description,
                            questionPaper: process.env.url + "/downloadfile/" + doc.questionPaper.split("\\").join("/"),
                            class: doc.class
                        }
                    })
                    res.status(200).json({
                        docs: assessments
                    });
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});
/* The following code is defining a route handler for GET requests to "/teachers/:teacherID". */

router.get("/teachers/:teacherID", (req, res) => {
    Assessments.find().populate('class').exec()
        .then(docs => {
            var assessments = docs.filter(doc => doc.class ? doc.class.teacher == req.params.teacherID : false);
            var assessments = assessments.map(doc => {
                return {
                    _id: doc._id,
                    maxMarks: doc.maxMarks,
                    weightageMarks: doc.weightageMarks,
                    postedOn: doc.postedOn,
                    lastDate: doc.lastDate,
                    title: doc.title,
                    description: doc.description,
                    questionPaper: process.env.url + "/downloadfile/" + doc.questionPaper.split("\\").join("/"),
                    class: doc.class
                }
            })
            res.status(200).json({
                docs: assessments
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.get('/exams/:teacherID', (req, res) => {
    Assessments.find().populate('class').exec()
        .then(docs => {
            var assessments = docs.filter(doc => doc.class ? doc.class.teacher == req.params.teacherID : false);
            var assessments = assessments.map(doc => {
                return {
                    _id: doc._id,
                    maxMarks: doc.maxMarks,
                    weightageMarks: doc.weightageMarks,
                    postedOn: doc.postedOn,
                    lastDate: doc.lastDate,
                    title: doc.title,
                    description: doc.description,
                    questionPaper: process.env.url + "/downloadfile/" + doc.questionPaper.split("\\").join("/"),
                    class: doc.class
                }
            });
            Exams.find().populate('class').exec()
                .then(docs => {
                    var docs = docs.filter(doc => doc.class ? doc.class.teacher == req.params.teacherID : false);
                    var exams = docs.map(doc => {
                        return {
                            _id: doc._id,
                            date: doc.date,
                            startTime: timeToString(doc.startTime),
                            endTime: timeToString(doc.endTime),
                            maxMarks: doc.maxMarks,
                            //weightageMarks: doc.weightageMarks,
                            examName: doc.examName.name + " - " + doc.examName.sequence,
                            subject: doc.class.subject,
                            standard: doc.class.standard,
                            section: doc.class.section
                        }
                    });
                    res.status(200).json({
                        docs: {
                            assessmentMarks: assessments,
                            examMarks: exams
                        }
                    });
                })
                .catch(err => {
                    res.status(500).json({
                        error: err,
                        seq: 1
                    })
                });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
})

/* The following code is a route handler for a POST request. It is used to upload an assessment document to
a server. */

router.post("/", checkAuth, upload.single('questionPaper'), (req, res) => {
    var assessment = new Assessments({
        _id: new mongoose.Types.ObjectId(),
        maxMarks: req.body.maxMarks,
        weightageMarks: req.body.weightageMarks ? req.body.weightageMarks : req.body.maxMarks,
        postedOn: new Date().toJSON(),
        lastDate: req.body.lastDate,
        title: req.body.title,
        description: req.body.description,
        questionPaper: 'assessments/' + makeUrlFriendly(req.file.filename),
        class: req.body.class
    });
    assessment.save()
        .then(doc => {
            bucket.upload(req.file.path, {
                destination: 'assessments/' + makeUrlFriendly(req.file.filename),
                metadata: {
                    contentType: req.file.mimetype
                }
            }, (err, file) => {
                if (err) {
                    res.status(500).json({
                        error: err
                    });
                }
                else {
                    res.status(201).json({
                        message: "Assessment Uploaded Successfully",
                        docs: doc
                    });
                }
            }
            );
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});
/* The following code is a patch route handler for updating the question paper of an assessment. It first
retrieves the assessment by its ID. If the assessment is not found, it returns a 404 error. */

router.patch("/questionPaper/:id", checkAuth, upload.single('questionPaper'), (req, res) => {
    var assessmentId = req.params.id;
    Assessments.findById(assessmentId)
        .exec()
        .then(assessment => {
            if (!assessment) {
                return res.status(404).json({
                    message: "Assessment not found",
                });
            }
            var oldFilePath = assessment.questionPaper;
            var oldFile = bucket.file(oldFilePath);

            oldFile.delete()
                .then(() => {
                    var newFilePath = 'assessments/' + makeUrlFriendly(req.file.filename);
                    var newFile = bucket.file(newFilePath);

                    bucket.upload(req.file.path, {
                        destination: 'assessments/' + makeUrlFriendly(req.file.filename),
                        metadata: {
                            contentType: req.file.mimetype
                        }
                    }, (err, file) => {
                        if (err) {
                            res.status(500).json({
                                error: err
                            });
                        }
                        else {
                            assessment.questionPaper = newFilePath;
                            assessment.save()
                                .then(updatedAssessment => {
                                    res.status(200).json({
                                        message: "Assessment Updated Successfully",
                                        docs: updatedAssessment
                                    });
                                })
                                .catch(err => {
                                    res.status(500).json({
                                        error: "Error uploading new file to Firebase Storage: " + err.message,
                                    });
                                });
                        }
                    }
                    );
                })
                .catch(err => {
                    res.status(500).json({
                        error: "Error deleting old file from Firebase Storage: " + err.message,
                    });
                });
        })
        .catch(err => {
            res.status(500).json({
                error: err.message,
            });
        });
});

/* The following code is a patch route handler for updating an assessment in a database. It first creates
an empty object called `updateOps`. Then, it loops through the `req.body` object, which contains the
properties and values to be updated. For each property-value pair, it adds it to the `updateOps`
object. */

router.patch("/:id", checkAuth, (req, res) => {
    var updateOps = {};
    for (var ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Assessments.findByIdAndUpdate(req.params.id, { $set: updateOps }).exec()
        .then(doc => {
            res.status(201).json({
                message: "Assessment Updated Successfully",
                docs: doc
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});
/* The following code is a route handler for a DELETE request to delete an assessment and its associated
files. */

router.delete("/:id", checkAuth, (req, res) => {
    var assessmentId = req.params.id;

    // Find the assessment in the database
    Assessments.findById(assessmentId)
        .exec()
        .then(assessment => {
            if (!assessment) {
                return res.status(404).json({
                    message: "Assessment not found",
                });
            }
            var filePath = assessment.questionPaper;
            var file = bucket.file(filePath);

            file.delete()
                .then(() => {
                    return Assessments.findByIdAndDelete(assessmentId).exec();
                })
                .then(() => {
                    return Answers.deleteMany({ assessment: assessmentId }).exec();
                })
                .then(() => {
                    res.status(200).json({
                        message: "Assessment and associated files deleted successfully",
                        docs: assessment,
                    });
                })
                .catch(err => {
                    res.status(500).json({
                        error: "Error deleting file from Firebase Storage: " + err.message,
                    });
                });
        })
        .catch(err => {
            res.status(500).json({
                error: err.message,
            });
        });
});

module.exports = router;