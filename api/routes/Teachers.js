var mongoose = require('mongoose');
var Teachers = require('../models/Teachers');
var express = require('express');
var router = express.Router();
var nodemailer = require("nodemailer");
var bcrypt = require("bcrypt");
var fs = require('fs');
var path = require('path');
var multer = require('multer');
var admin = require("firebase-admin");
var createCsvWriter = require('csv-writer').createObjectCsvWriter;
var jwt = require("jsonwebtoken");
var checkAuth = require('../middleware/checkAuth');
var makeUrlFriendly = require('../middleware/makeUrlFriendly');

/* the following code is configuring the storage options for file uploads using the multer library in
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

/* the following code is a JavaScript function called `fileFilter` that is used as a filter for accepting
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

/* the following code is configuring the multer middleware in a Node.js application. Multer is a middleware
used for handling file uploads in Node.js. */
var upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});

/* the following code is defining a JavaScript object called `serviceAccount`. This object contains various
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

/* the following code is initializing the Firebase Admin SDK in a JavaScript application. It is using the
`admin.initializeApp()` method to configure the SDK with the necessary credentials and storage
bucket URL. The `credential` parameter is being set with the `admin.credential.cert()` method, which
takes a service account object as an argument. The `storageBucket` parameter is being set with the
`process.env.BUCKET_URL` environment variable. The second argument `"teachers"` is an optional name
for this specific Firebase app instance. */
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.BUCKET_URL
}, "teachers");

/* the following code is creating a variable named "bucket" and assigning it the value of the storage
bucket object from the admin module. */
var bucket = admin.storage().bucket();

/* the following code is a route handler for the "/forgotpassword" endpoint. It is used to handle a POST
request to reset a teacher's password. */
router.post("/forgotpassword", (req, res, next) => {
    Teachers.find({ email: req.body.email }).exec()
        .then(docs => {
            if (docs.length > 0) {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        res.status(500).json({
                            error: err
                        });
                    } else {
                        Teachers.findByIdAndUpdate(docs[0]._id, { $set: { password: hash } }).exec()
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

/* the following code is a route handler for the "/signup" endpoint. It is used to handle the signup
process for a user. */
router.post("/signup", checkAuth, upload.single("profile"), (req, res, next) => {
    var email = req.body.email;
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var empID = req.body.empID;
    var userID = firstName + lastName + empID;
    var length = 10;
    var password = Array.from({ length }, () => String.fromCharCode(Math.floor(Math.random() * 26) + 97)).join('');
    var mailOptions = {
        from: 'schoolportal@vit.edu.in',
        to: req.body.email,
        subject: 'Login Credentials for School Portal',
        text: `Login into your account using the following credentials:\nUserID: ${userID}\nPassword: ${password}\n\nPlease change your password after logging in.`
    };
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            res.status(500).json({
                error: err
            });
        } else {
            var teacher = new Teachers({
                _id: new mongoose.Types.ObjectId(),
                password: hash,
                email: email,
                userID: userID,
                firstName: firstName,
                lastName: lastName,
                empID: empID,
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
                phoneNumber: req.body.phoneNumber,
                qualification: req.body.qualification,
                designation: req.body.designation,
                experience: req.body.experience,
                primarySubject: req.body.primarySubject,
                salaryDetails: {
                    basic: req.body.salaryDetails ? req.body.salaryDetails.basic : 0,
                    hra: req.body.salaryDetails ? req.body.salaryDetails.hra : 0,
                    conveyance: req.body.salaryDetails ? req.body.salaryDetails.conveyance: 0,
                    pa: req.body.salaryDetails ? req.body.salaryDetails.pa : 0,
                    pf: req.body.salaryDetails ? req.body.salaryDetails.pf : 0,
                    pt: req.body.salaryDetails ? req.body.salaryDetails.pt : 0,
                },
                profile: req.file ? 'profiles/' + makeUrlFriendly(req.file.filename) : null
            });
            teacher.save()
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
                                var transporter = nodemailer.createTransport({
                                    service: process.env.MAIL_SERVER || 'gmail',
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
                            service: process.env.MAIL_SERVER || 'gmail',
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
});

/* the following code is implementing a login functionality for a router in a Node.js application. When a
POST request is made to the "/login" endpoint, it searches for a teacher with the provided userID in
the database. If a teacher is found, it compares the provided password with the stored password
using bcrypt. If the passwords match, it generates a JSON Web Token (JWT) with the teacher's userID
and _id, and signs it using a secret key. If the teacher has a profile image, it generates a signed
URL for the image using Google Cloud Storage, and includes it in the response. */
router.post("/login", (req, res, next) => {
    Teachers.find({ userID: req.body.userID }).exec()
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
                                expires: Date.now() + 1000 * 60 * 60 * 24 * 7 //one week
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

/* the following code is a route handler for a POST request to update a teacher's profile picture. It uses
the Express router to handle the request. */
router.post("/profile/:id", checkAuth, upload.single("profile"), (req, res) => {
    Teachers.findByIdAndUpdate(req.params.id, { profile: req.file ? 'profiles/' + makeUrlFriendly(req.file.filename) : null }).exec()
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

/* the following code is defining a route handler for a GET request to the root URL ("/"). It uses the
`checkAuth` middleware function to authenticate the request. If the authentication is successful, it
executes a database query to find all documents in the "Teachers" collection. If the query is
successful, it sends a JSON response with a status code of 200 and the found documents. If there is
an error during the query, it sends a JSON response with a status code of 500 and the error message. */
router.get("/", checkAuth, (req, res, next) => {
    Teachers.find().exec()
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

/* the following code is defining a route in a JavaScript router that generates a CSV file containing
information about teachers. */
router.get("/generatecsv", (req, res, next) => {
            Teachers.find().exec()
                .then(docs => {
                    if (docs.length < 1) {
                        res.status(404).json({
                            message: "No Teachers Found"
                        })
                    } else {
                        var csvWriter = createCsvWriter({
                            path: "public/csv/teachers.csv",
                            header: [
                                { id: '_id', title: 'id' },
                                { id: 'name', title: 'Name' },
                                { id: 'empid', title: 'EmployeeID' },
                                { id: 'status', title: 'Status' }
                            ]
                        });
                        var teacherArray = docs.map(doc => {
                            return {
                                _id: doc._id,
                                name: doc.firstName + " " + doc.lastName,
                                empid: doc.empID,
                                status: null
                            }
                        });
                        csvWriter
                            .writeRecords(teacherArray)
                            .then(() => res.download(path.join(__dirname, "../../public/csv/teachers.csv")))
                            .catch((error) => console.error(error));
                    }
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });
});

/* the following code is defining a route handler for a GET request with a dynamic parameter ":id". It
first checks for authentication using the "checkAuth" middleware. Then, it uses the "Teachers" model
to find a document with the specified id. */
router.get("/:id", checkAuth, (req, res, next) => {
    Teachers.findById(req.params.id).exec()
        .then(doc => {
            if (doc.profile) {
                var file = bucket.file(doc.profile);
                var options = {
                    version: 'v4',
                    action: 'read',
                    expires: Date.now() + 1000 * 60 * 60 * 24 * 7 //one week
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

/* the following code is defining a PATCH route for changing the user ID of a teacher. It first checks if
the authenticated user's ID matches the provided ID. If not, it returns an error message. If the IDs
match, it then checks if the new user ID already exists in the database. If it does, it returns an
error message. If the new user ID doesn't exist, it finds the teacher with the provided ID and
checks if the current user ID matches the one provided. If not, it returns an error message. If the
current user ID matches, it compares the provided password with */
router.patch("/changeuserid", checkAuth, (req, res) => {
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
        Teachers.find({ userID: newUserID }).exec()
            .then(docs => {
                if (docs.length >= 1) {
                    res.status(409).json({
                        message: "UserID Already Exists"
                    })
                } else {
                    Teachers.findById(id).exec()
                        .then(doc => {
                            if (doc === null) {
                                res.status(404).json({
                                    message: "Teacher Not Found"
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
                                        Teachers.findByIdAndUpdate(id, { userID: newUserID }).exec()
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
                        .catch(err => {
                            res.status(500).json({
                                error: err
                            })
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

/* the following code is implementing a route handler for a PATCH request to change a user's password. It
first checks if the user is authenticated using the checkAuth middleware. Then, it compares the
provided current password with the stored password of the user in the database. If the passwords
match, it hashes the new password and updates the user's password in the database. Finally, it sends
a response indicating whether the password was updated successfully or if there was an error. */
router.patch("/changepassword", checkAuth, (req, res) => {
    var id = req.body.id;
    if (req.userData._id !== id) {
        res.status(401).json({
            message: "Invalid UserID and Password"
        });
    }
    else {
        var currentPassword = req.body.currentPassword;
        var newPassword = req.body.newPassword;
        Teachers.findById(id).exec()
            .then(doc => {
                bcrypt.compare(currentPassword, doc.password, (err, response) => {
                    if (err) {
                        res.status(401).json({
                            message: "Invalid UserID and Password"
                        });
                    }
                    if (response) {
                        bcrypt.hash(newPassword, 10, (err, hash) => {
                            Teachers.findByIdAndUpdate(id, { password: hash }).exec()
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

/* the following code is a patch route handler for updating a teacher's information in a database. It
requires authentication (checkAuth middleware) before allowing the update operation. */
router.patch("/:id", checkAuth, (req, res, next) => {
    var id = req.params.id;
    var updateOps = {};
    for (var ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Teachers.findByIdAndUpdate(id, updateOps).exec()
        .then(docs => {
            res.status(200).json({
                message: "Teacher Updated Successfully",
                docs: docs
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* the following code is defining a DELETE route for a router in a Node.js application. The route is
defined with the path "/:id", which means it expects an id parameter in the URL. The code also
includes a middleware function called "checkAuth" that is executed before the route handler. */
router.delete("/:id", checkAuth, (req, res, next) => {
    var id = req.params.id;
    Teachers.findByIdAndDelete(req.params.id)
        .exec()
        .then(docs => {
            res.status(200).json({
                message: "Teacher Deleted Successfully",
                docs: docs
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

module.exports = router;