var mongoose = require("mongoose");
var Answers = require("../models/Answers");
var multer = require('multer');
var admin = require("firebase-admin");
var express = require("express");
var checkAuth = require('../middleware/checkAuth');
var makeUrlFriendly = require('../middleware/makeUrlFriendly');
var router = express.Router();


/* The code `var storage = multer.diskStorage({ destination: function (req, file, cb) { cb(null,
"./answers/"); }, filename: function (req, file, cb) { cb(null, Date.now() + "-" +
file.originalname) } });` is configuring the storage settings for multer, a middleware used for
handling file uploads in Node.js. */
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./answers/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname)

    }
});

/* The `fileFilter` function is used as a filter for the multer middleware to determine which files
should be accepted or rejected during the file upload process. */
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

/* The code `var upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 10 },
fileFilter: fileFilter });` is creating an instance of the multer middleware with the specified
configuration options. */
var upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});

/* The following code is initializing a Firebase Admin SDK service account and creating a storage bucket.
It is using environment variables to set the necessary credentials and configuration for the service
account. The service account is used to authenticate and authorize access to Firebase services, such
as storage. The code initializes the Firebase Admin SDK with the service account credentials and
sets the storage bucket URL. Finally, it creates a bucket object that can be used to interact with
the storage bucket. */
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
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.BUCKET_URL
}, "answers");

var bucket = admin.storage().bucket();

//API Routes
router.get("/", checkAuth, (req, res) => {
    Answers.find().populate([{ path: "assessment", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(docs => {
            var answers = docs.map(doc => {
                return {
                    _id: doc._id,
                    assessment: doc.assessment,
                    student: doc.student,
                    answerFile: process.env.url + "/downloadfile/" + doc.answerFile.split("\\").join("/"),
                    postedOn: doc.postedOn
                }
            });
            res.status(200).json({
                count: docs.length,
                docs: answers
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

/* The following code is defining a route handler for a GET request with a dynamic parameter ":id". It
first calls the "checkAuth" middleware function to authenticate the request. Then, it uses the
"findById" method to find a document in the "Answers" collection based on the provided "id". The
found document is then populated with related data from the "assessment" and "student" collections
using the "populate" method. Finally, the response is sent with the retrieved data, including the
"_id", "assessment", "student", "answerFile" (with a modified URL), and " */
router.get("/:id", checkAuth, (req, res) => {
    Answers.findById(req.params.id).populate([{ path: "assessment", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(doc => {
            res.status(200).json({
                _id: doc._id,
                assessment: doc.assessment,
                student: doc.student,
                answerFile: process.env.url + "/downloadfile/" + doc.answerFile.split("\\").join("/"),
                postedOn: doc.postedOn
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        })
});

/* The following code is defining a route in a JavaScript router that handles a GET request to
"/assessments/:assID". It first checks if the user is authenticated using the "checkAuth"
middleware. */
router.get("/assessments/:assID", checkAuth, (req, res) => {
    Answers.find({ assessment: req.params.assID }).populate([{ path: "assessment", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(docs => {
            var answers = docs.map(doc => {
                return {
                    _id: doc._id,
                    assessment: doc.assessment,
                    student: doc.student,
                    answerFile: process.env.url + "/downloadfile/" + doc.answerFile.split("\\").join("/"),
                    postedOn: doc.postedOn
                }
            });
            res.status(200).json({
                count: docs.length,
                docs: answers
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

/* The following code is defining a route in a JavaScript router that handles a GET request to
"/students/:studentID". It uses the checkAuth middleware to authenticate the request. */
router.get("/students/:studentID", checkAuth, (req, res) => {
    Answers.find({ student: req.params.studentID }).populate([{ path: "assessment", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(docs => {
            var answers = docs.map(doc => {
                return {
                    _id: doc._id,
                    assessment: doc.assessment,
                    student: doc.student,
                    answerFile: process.env.url + "/downloadfile/" + doc.answerFile.split("\\").join("/"),
                    postedOn: doc.postedOn
                }
            });
            res.status(200).json({
                count: docs.length,
                docs: answers
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

/* The following code is defining a route handler for GET requests to "/teachers/:teacherID". It first
checks for authentication using the "checkAuth" middleware. */
router.get("/teachers/:teacherID", checkAuth, (req, res) => {
    Answers.find().populate([{ path: "assessment", populate: { path: "class", populate: { path: "teacher" } } }, { path: "student" }]).exec()
        .then(docs => {
            var answers = docs.filter(doc => doc.assessment.class ? doc.assessment.class.teacher._id == req.params.teacherID : false).map(doc => {
                return {
                    _id: doc._id,
                    assessment: doc.assessment,
                    student: doc.student,
                    answerFile: process.env.url + "/downloadfile/" + doc.answerFile.split("\\").join("/"),
                    postedOn: doc.postedOn
                }
            });
            res.status(200).json({
                count: docs.length,
                docs: answers
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});
/* The following code is a route handler for a POST request. It is used to handle the uploading of an
answer file for a specific assessment by a student. */

router.post("/", checkAuth, upload.single('answerFile'), (req, res) => {
    var answer = new Answers({
        _id: new mongoose.Types.ObjectId(),
        assessment: req.body.assessment,
        student: req.body.student,
        answerFile: 'answers/' + makeUrlFriendly(req.file.filename),
        postedOn: new Date().toJSON()
    });
    answer.save()
        .then(doc => {
            bucket.upload(req.file.path, {
                destination: 'answers/' + makeUrlFriendly(req.file.filename),
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
                    console.log(file);
                    res.status(201).json({
                        message: "Answer Uploaded Successfully",
                        doc: doc
                    });
                }
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});
/* The following code is a route handler for a PATCH request to update an answer in a database. It first
checks if the answer exists by finding it using the provided ID. If the answer is not found, it
returns a 404 error. */

router.patch("/:id", checkAuth, upload.single("answerFile"), (req, res) => {
    var id = req.params.id;
    Answers.findById(id)
        .exec()
        .then(answer => {
            if (!answer) {
                return res.status(404).json({
                    message: "Answer not found",
                });
            }
            var oldFilePath = answer.answerFile;
            var oldFile = bucket.file(oldFilePath);

            oldFile.delete()
                .then(() => {
                    var newFilePath = 'answers/' + makeUrlFriendly(req.file.filename);
                    var newFile = bucket.file(newFilePath);

                    bucket.upload(req.file.path, {
                        destination: 'answers/' + makeUrlFriendly(req.file.filename),
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
                            answer.answerFile = newFilePath;
                            answer.save()
                                .then(updatedAnswer => {
                                    res.status(200).json({
                                        message: "Answer Updated Successfully",
                                        docs: updatedAnswer
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
/* The following code is a route handler for a DELETE request to delete an answer and its associated file.
It first retrieves the answer by its ID using the `findById` method. If the answer is not found, it
returns a 404 status with a message. */

router.delete("/:id", checkAuth, (req, res) => {
    var answerId = req.params.id;

    Answers.findById(answerId)
        .exec()
        .then(answer => {
            if (!answer) {
                return res.status(404).json({
                    message: "Answer not found",
                });
            }

            var filePath = answer.answerFile;
            var file = bucket.file(filePath);

            file.delete()
                .then(() => {
                    return Answers.findByIdAndDelete(answerId).exec();
                })
                .then(() => {
                    res.status(200).json({
                        message: "Answer and associated file deleted successfully",
                        doc: answer,
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