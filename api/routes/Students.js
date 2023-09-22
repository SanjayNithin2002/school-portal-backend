var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var nodemailer = require("nodemailer");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var fs = require('fs');
var path = require('path');
var multer = require('multer');
var admin = require("firebase-admin");
var createCsvWriter = require('csv-writer').createObjectCsvWriter;
var Students = require('../models/Students');
var Classes = require('../models/Classes');
var Fees = require('../models/Fees');
var Payments = require('../models/Payments');
var checkAuth = require('../middleware/checkAuth');
var makeUrlFriendly = require('../middleware/makeUrlFriendly');

/**
 * The function `addPayments` retrieves fees based on the student's standard, creates payment objects
 * with the retrieved fees and student ID, sets the status to "Pending", and inserts the payment
 * objects into the Payments collection.
 * 
 * :param studDoc: The `studDoc` parameter is an object that represents a student document. It likely
 * contains properties such as `standard` and `_id` which are used in the function to retrieve fees and
 * create payment documents
 */
async function addPayments(studDoc) {
    Fees.find({ standard: studDoc.standard }).select('_id').exec()
        .then(fees => {
            var payments = fees.map(fee => {
                return {
                    _id: new mongoose.Types.ObjectId(),
                    fees: fee._id,
                    student: studDoc._id,
                    status: "Pending"
                }
            });
            Payments.insertMany(payments)
                .then(docs => console.log(docs))
                .catch(err => console.log(err));
        })
        .catch(err => console.log(err));
}

/**
 * The function `updateMultipleRecords` updates multiple records in a database using an array of update
 * objects.
 * 
 * :param updatesArray: The `updatesArray` parameter is an array of objects. Each object represents an
 * update operation for a document in the `Students` collection. The objects in the array should have
 * the following structure:
 */
async function updateMultipleRecords(updatesArray) {
    var updatePromises = updatesArray.map(async (update) => {
        try {
            var { _id, ...updateData } = update;
            var result = await Students.updateOne({ _id }, updateData);
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

/* The above code is configuring the storage options for file uploads using the multer library in
JavaScript. It sets the destination folder for uploaded files to "./profiles/" and generates a
unique filename for each uploaded file using the current timestamp and the original filename. */
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./profiles/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname)

    }
});

/* The above code is a JavaScript function called `fileFilter` that is used as a filter for accepting
or rejecting files based on their mimetype. */
var fileFilter = (req, file, cb) => {
    //accept
    if (file.mimetype === 'image/jpeg') {
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

/* The above code is defining a JavaScript object called `serviceAccount`. This object contains various
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

/* The above code is initializing the Firebase Admin SDK in a JavaScript environment. It is using the
`admin.initializeApp()` function to configure the SDK with the necessary credentials and storage
bucket URL. The `credential` parameter is used to provide the service account credentials required
for authentication, and the `storageBucket` parameter is used to specify the URL of the Firebase
Storage bucket. */
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.BUCKET_URL
});

/* The above code is creating a variable named "bucket" and assigning it the value of the storage
bucket object from the admin module. */
var bucket = admin.storage().bucket();

/* The above code is a route handler for the "/forgotpassword" endpoint. It is used to handle a POST
request to reset a student's password. */
router.post("/forgotpassword", (req, res, next) => {
    Students.find({ email: req.body.email }).exec()
        .then(docs => {
            if (docs.length > 0) {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        res.status(500).json({
                            error: err
                        });
                    } else {
                        Students.findByIdAndUpdate(docs[0]._id, { $set: { password: hash } }).exec()
                            .then(docs => {
                                res.status(201).json({
                                    message: "Password Updated Successfully"
                                });
                            })
                            .catch(err => {
                                res.status(500).json({
                                    error: err
                                });
                            });
                    }
                })
            } else {
                res.status(404).json({
                    message: "Email not found"
                });
            }
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The above code is a route handler for the "/signup" endpoint. It is used to handle the signup
process for a user. Here is a breakdown of what the code is doing: */
router.post("/signup", checkAuth, upload.single("profile"), async (req, res, next) => {
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var dob = new Date(req.body.dob);
    var userID = firstName + lastName + dob.getDate() + Number(dob.getMonth() + 1) + dob.getFullYear();
    var length = 10;
    var password = Array.from({ length }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('');
    var mailOptions = {
        from: 'schoolportal@vit.edu.in',
        to: req.body.email,
        subject: 'Login Credentials for School Portal',
        text: `Login into your account using the following credentials:\nUserID: ${userID}\nPassword: ${password}\n\nPlease change your password after logging in.`
    };

    Students.find({ userID: userID }).exec()
        .then(docs => {
            if (docs.length > 0) {
                userID = userID + Math.floor(Math.random() * 10);
            }
            bcrypt.hash(password, 10, (err, hash) => {
                if (err) {
                    res.status(500).json({
                        error: err
                    });
                } else {
                    var student = new Students({
                        _id: new mongoose.Types.ObjectId(),
                        password: hash,
                        email: req.body.email,
                        userID: userID,
                        applicationNumber: req.body.applicationNumber,
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        standard: req.body.standard,
                        section: req.body.section,
                        dob: req.body.dob,
                        gender: req.body.gender,
                        bloodGroup: req.body.bloodGroup,
                        aadharNumber: req.body.aadharNumber,
                        motherTongue: req.body.motherTongue,
                        address: {
                            line1: req.body.address ? req.body.address.line1 : "NA",
                            line2: req.body.address ? req.body.address.line2 : "NA",
                            city: req.body.address ? req.body.address.city : "NA",
                            state: req.body.address ? req.body.address.state : "NA",
                            pincode: req.body.address ? req.body.address.pincode : "NA",
                        },
                        father: {
                            name: (req.body.father ? req.body.father.name : "NA"),
                            age: (req.body.father ? req.body.father.age : 0),
                            qualification: (req.body.father ? req.body.father.qualification : "NA"),
                            occupation: (req.body.father ? req.body.father.occupation : "NA"),
                            annualIncome: (req.body.father ? req.body.father.annualIncome : 0),
                            phoneNumber: (req.body.father ? req.body.father.phoneNumber : "NA"),
                            email: (req.body.father ? req.body.father.email : "NA")
                        },
                        mother: {
                            name: (req.body.mother ? req.body.mother.name : "NA"),
                            age: (req.body.mother ? req.body.mother.age : 0),
                            qualification: (req.body.mother ? req.body.mother.qualification : "NA"),
                            occupation: (req.body.mother ? req.body.mother.occupation : "NA"),
                            annualIncome: (req.body.mother ? req.body.mother.annualIncome : 0),
                            phoneNumber: (req.body.mother ? req.body.mother.phoneNumber : "NA"),
                            email: (req.body.mother ? req.body.mother.email : "NA")
                        },
                        guardian: {
                            name: (req.body.guardian ? req.body.guardian.name : "NA"),
                            age: (req.body.guardian ? req.body.guardian.age : 0),
                            qualification: (req.body.guardian ? req.body.guardian.qualification : "NA"),
                            occupation: (req.body.guardian ? req.body.guardian.occupation : "NA"),
                            annualIncome: (req.body.guardian ? req.body.guardian.annualIncome : 0),
                            phoneNumber: (req.body.guardian ? req.body.guardian.phoneNumber : "NA"),
                            email: (req.body.guardian ? req.body.guardian.email : "NA")
                        },
                        profile: req.file ? 'profiles/' + makeUrlFriendly(req.file.filename) : null,
                    });

                    student.save()
                        .then(async (studDoc) => {
                            var results = await addPayments(studDoc);
                            if (req.file) {
                                bucket.upload(req.file.path, {
                                    destination: 'profiles/' + makeUrlFriendly(req.file.filename),
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
                                        var transporter = nodemailer.createTransport({
                                            service: 'gmail',
                                            auth: {
                                                user: process.env.NODEMAIL,
                                                pass: process.env.NODEMAIL_PASSWORD
                                            }
                                        }).sendMail(mailOptions, (error, info) => {
                                            if (error) {
                                                console.log(error);
                                            } else {
                                                res.status(201).json({
                                                    message: "User Created and Mail Sent"
                                                });
                                            }
                                        });
                                    }
                                }
                                )
                            } else {
                                var transporter = nodemailer.createTransport({
                                    service: 'gmail',
                                    auth: {
                                        user: process.env.NODEMAIL,
                                        pass: process.env.NODEMAIL_PASSWORD
                                    }
                                }).sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        console.log(error);
                                    } else {
                                        res.status(201).json({
                                            message: "User Created and Mail Sent"
                                        });
                                    }
                                });
                            }
                        })
                        .catch(err => {
                            res.status(500).json({
                                error: err
                            })
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

/* The above code is implementing a login functionality in a router using the Express framework in
JavaScript. */
router.post("/login", (req, res, next) => {
    Students.find({ userID: req.body.userID }).exec()
        .then(docs => {
            if (docs.length < 1) {
                res.status(401).json({
                    message: "UserID Not Found"
                });
            } else {
                bcrypt.compare(req.body.password, docs[0].password, (err, response) => {
                    if (err) {
                        res.status(401).json({
                            message: "Invalid UserID and Password"
                        });
                    }
                    if (response) {
                        var token = jwt.sign({
                            userID: docs[0].userID,
                            _id: docs[0]._id
                        }, process.env.JWT_KEY, {
                            expiresIn: "24h"
                        });
                        if (docs[0].profile) {
                            var file = bucket.file(docs[0].profile);
                            var options = {
                                version: 'v4',
                                action: 'read',
                                expires: Date.now() + 1000 * 60 * 60 * 24 * 7 // one week
                            };
                            file.getSignedUrl(options)
                                .then(url => {
                                    res.status(200).json({
                                        message: "Auth Successful",
                                        docs: docs[0],
                                        token: token,
                                        profile: url
                                    });
                                }
                                ).catch(err => {
                                    res.status(500).json({
                                        error: err
                                    });
                                }
                                );
                        }
                        else {
                            res.status(200).json({
                                message: "Auth Successful",
                                docs: docs[0],
                                token: token
                            });
                        }
                    } else {
                        res.status(401).json({
                            message: "Invalid UserID and Password"
                        });
                    }
                })
            }
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The above code is a route handler for a POST request to update a student's profile picture. It uses
the Express router to handle the request. */
router.post("/profile/:id", checkAuth, upload.single("profile"), (req, res) => {
    Students.findByIdAndUpdate(req.params.id, { profile: req.file ? 'profiles/' + makeUrlFriendly(req.file.filename) : null }).exec()
        .then(docs => {
            if (req.file) {
                bucket.upload(req.file.path, {
                    destination: 'profiles/' + makeUrlFriendly(req.file.filename),
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
                            "message": "Profile Picture Added Successfuly!"
                        })
                    }
                }
                )
            }
            else{
                res.status(400).json({
                    "message": "Profile Picture Not Uploaded!"
                })
            }
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The above code is defining a route handler for a GET request to the root URL ("/"). It uses the
`checkAuth` middleware function to authenticate the request. */
router.get("/", checkAuth, (req, res, next) => {
    Students.find().exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});

/* The above code is defining a route handler for a GET request with a dynamic parameter ":id". It
first checks for authentication using the "checkAuth" middleware. */
router.get("/:id", checkAuth, (req, res, next) => {
    Students.findById(req.params.id).exec()
        .then(doc => {
            if (doc.profile) {
                var file = bucket.file(doc.profile);
                var options = {
                    version: 'v4',
                    action: 'read',
                    expires: Date.now() + 1000 * 60 * 60 * 24 * 7 // one week
                };
                file.getSignedUrl(options)
                    .then(url => {
                        res.status(200).json({
                            docs: doc,
                            profile: url
                        });
                    }
                    ).catch(err => {
                        res.status(500).json({
                            error: err
                        });
                    }
                    );
            }
            else {
                res.status(200).json({
                    docs: doc
                })
            }
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});

/* The above code is defining a route in a JavaScript router. When a GET request is made to
"/class/:classID", the code first checks if the user is authenticated using the checkAuth
middleware. If the user is authenticated, the code then finds a class document in the database based
on the classID parameter. It then finds all the students in the same standard and section as the
class document. Finally, it sends a JSON response with the found student documents or an error if
there was a problem with the database query. */
router.get("/class/:classID", checkAuth, (req, res, next) => {
    Classes.findById(req.params.classID).exec()
        .then(docs => {
            Students.find({ standard: docs.standard, section: docs.section }).exec()
                .then(docs => {
                    res.status(200).json({
                        docs: docs
                    })
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                })
        })
});

/* The above code is defining a route in a Node.js Express router. This route is accessed via a GET
request to "/marks/generatecsv/:standard/:section". */
router.get("/marks/generatecsv/:standard/:section", checkAuth, (req, res, next) => {
    var filePath = "public/marks/" + req.params.standard + req.params.section + ".csv";
    fs.access(filePath, fs.constants.F_OK, (error) => {
        if (error) {
            Students.find({ standard: req.params.standard, section: req.params.section }).exec()
                .then(docs => {
                    if (docs.length < 1) {
                        res.status(404).json({
                            message: "No Students Found"
                        })
                    } else {
                        var csvWriter = createCsvWriter({
                            path: "public/marks/" + req.params.standard + req.params.section + ".csv",
                            header: [
                                { id: '_id', title: 'id' },
                                { id: 'name', title: 'Name' },
                                { id: "scoredMarks", title: "scoredMarks" },
                                { id: "remarks", title: "Remarks" }
                            ]
                        });
                        var studentArray = docs.map((student) => {
                            return {
                                _id: student._id,
                                name: student.firstName + " " + student.lastName,
                                scoredMarks: null,
                                remarks: null
                            }
                        });
                        csvWriter
                            .writeRecords(studentArray)
                            .then(() => res.download(path.join(__dirname, "../../public/marks/" + req.params.standard + req.params.section + ".csv")))
                            .catch((error) => console.error(error));
                    }
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });
        } else {
            res.download(path.join(__dirname, "../../public/marks/" + req.params.standard + req.params.section + ".csv"));
        }
    });
});

/* The above code is defining a route in a Node.js Express router. The route is for generating and
downloading a CSV file based on a given standard. */
router.get("/generatecsv/:standard", checkAuth, (req, res, next) => {
    var filePath = "public/students/" + req.params.standard + ".csv";
    fs.access(filePath, fs.varants.F_OK, (error) => {
        if (error) {
            Students.find({ standard: req.params.standard }).exec()
                .then(docs => {
                    if (docs.length < 1) {
                        res.status(404).json({
                            message: "No Students Found"
                        })
                    } else {
                        var csvWriter = createCsvWriter({
                            path: "public/students/" + req.params.standard + ".csv",
                            header: [
                                { id: '_id', title: 'id' },
                                { id: 'name', title: 'Name' },
                                { id: 'gender', title: 'Gender' },
                                { id: 'section', title: 'Section' }
                            ]
                        });
                        var studentArray = docs.map((student) => {
                            return {
                                _id: student._id,
                                name: student.firstName + " " + student.lastName,
                                gender: student.gender,
                                section: null
                            }
                        });
                        csvWriter
                            .writeRecords(studentArray)
                            .then(() => res.download(path.join(__dirname, "../../public/students/" + req.params.standard + ".csv")))
                            .catch((error) => console.error(error));
                    }
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });
        } else {
            res.download(path.join(__dirname, "../../public/students/" + req.params.standard + req.params.section + ".csv"));
        }
    });
});

/* The above code is implementing a PATCH route in a router for changing a user's ID. It first checks
if the authenticated user's ID matches the provided ID. If not, it returns a 401 Unauthorized
response. If the IDs match, it then checks if the new user ID already exists in the database. If it
does, it returns a 409 Conflict response. If the new user ID doesn't exist, it finds the student
with the provided ID and checks if the current user ID matches the one provided. If not, it returns
a 401 Unauthorized response. If the current user ID matches */
router.patch("/changeuserid", checkAuth, (req, res, next) => {
    var id = req.body.id;
    if (req.userData._id !== id) {
        res.status(401).json({
            message: "Invalid UserID and Password"
        })
    }
    else {
        var currentUserID = req.body.currentUserID;
        var newUserID = req.body.newUserID;
        var password = req.body.password;
        Students.find({ userID: newUserID }).exec()
            .then(docs => {
                if (docs.length >= 1) {
                    res.status(409).json({
                        message: "User ID Already Exists"
                    })
                } else {
                    Students.findById(id).exec()
                        .then(doc => {
                            if (doc === null) {
                                res.status(404).json({
                                    message: "Student Not Found"
                                })
                            } else if (doc.userID !== currentUserID) {
                                res.status(401).json({
                                    message: "Invalid UserID and Password"
                                })
                            }
                            else {
                                bcrypt.compare(password, doc.password, (err, response) => {
                                    if (err) {
                                        res.status(401).json({
                                            message: "Invalid UserID and Password"
                                        });
                                    }
                                    if (response) {
                                        Students.findByIdAndUpdate(id, { userID: newUserID }).exec()
                                            .then(docs => {
                                                res.status(200).json({
                                                    message: "User ID Updated Successfully",
                                                    docs: docs
                                                })
                                            })
                                            .catch(err => {
                                                res.status(500).json({
                                                    error: err
                                                })
                                            })
                                    } else {
                                        res.status(401).json({
                                            message: "Invalid UserID and Password"
                                        });
                                    }
                                })
                            }
                        })
                }
            }).catch(err => {
                res.status(500).json({
                    error: err
                })
            })
    }
});

/* The above code is a route handler for a PATCH request to change a user's password. It first checks
if the user ID in the request body matches the user ID in the authenticated user's data. If they
don't match, it returns a 401 Unauthorized response. */
router.patch("/changepassword", checkAuth, (req, res) => {
    if (req.userData._id !== req.body.id) {
        res.status(401).json({
            message: "Invalid UserID and Password"
        });
    } else {
        var id = req.body.id;
        var currentPassword = req.body.currentPassword;
        var newPassword = req.body.newPassword;
        Students.findById(id).exec()
            .then(doc => {
                bcrypt.compare(currentPassword, doc.password, (err, response) => {
                    if (err) {
                        res.status(401).json({
                            message: "Invalid UserID and Password"
                        });
                    }
                    if (response) {
                        bcrypt.hash(newPassword, 10, (err, hash) => {
                            Students.findByIdAndUpdate(id, { password: hash }).exec()
                                .then(docs => {
                                    res.status(200).json({
                                        message: "Password Updated Successfully"
                                    })
                                })
                                .catch(err => {
                                    res.status(500).json({
                                        error: err
                                    })
                                });
                        });
                    } else {
                        res.status(401).json({
                            message: "Invalid UserID and Password"
                        });
                    }
                })
            }).catch(err => {
                res.status(500).json({
                    error: err
                })
            });
    }
});

/* The above code is defining a PATCH route handler for the '/patchmany' endpoint. When a PATCH request
is made to this endpoint, it will execute the 'updateMultipleRecords' function with the request body
as an argument. The function is expected to update multiple student records based on the provided
data. */
router.patch('/patchmany', async (req, res) => {
    try {
        var results = await updateMultipleRecords(req.body);

        res.status(200).json({
            message: 'Updated the students records',
            docs: results,
        });
    } catch (err) {
        res.status(500).json({
            error: err.message || 'Internal server error',
        });
    }
});


/* The above code is a patch route handler for updating a student record in a database. It requires
authentication (checkAuth) before allowing the update operation. */
router.patch("/:id", checkAuth, (req, res, next) => {
    var id = req.params.id;
    var updateOps = {};
    for (var ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Students.findByIdAndUpdate(id, updateOps).exec()
        .then(docs => {
            res.status(200).json({
                message: "Student Updated Successfully",
                docs: docs,
                updateOps: updateOps
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});

/* The above code is defining a DELETE route for a router in a Node.js application. The route is
defined with the path "/:id", which means it expects an id parameter in the URL. The route also uses
the checkAuth middleware function to ensure that the user is authenticated before allowing the
deletion of a student. */
router.delete("/:id", checkAuth, (req, res, next) => {
    var id = req.params.id;
    Students.findByIdAndDelete(id).exec()
        .then(docs => {
            res.status(200).json({
                message: "Student Deleted Successfully",
                docs: docs
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        })
});

module.exports = router;