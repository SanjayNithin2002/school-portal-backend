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

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./profiles/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname)

    }
});

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

var upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});

var serviceAccount = {
    type: process.env.type,
    project_id: process.env.project_id,
    private_key_id: process.env.private_key_id,
    private_key: process.env.private_key.replace(/\\n/g, '\n'),
    client_email: process.env.client_email,
    client_id: process.env.client_id,
    auth_uri: process.env.auth_uri,
    token_uri: process.env.token_uri,
    auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url,
    client_x509_cert_url: process.env.client_x509_cert_url,
    universe_domain: process.env.universe_domain
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.BUCKET_URL
}, "teachers");

var bucket = admin.storage().bucket();

router.post("/sendotp", (req, res, next) => {
    var otp = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);
    var mailOptions = {
        from: 'schoolportal@vit.edu.in',
        to: req.body.email,
        subject: 'Verify your OTP for School Portal',
        text: 'Your OTP for the school portal is ' + otp
    };
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.NODEMAIL,
            pass: process.env.NODEMAIL_PASSWORD
        }
    })
        .sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                res.status(201).json({
                    message: "OTP Sent Successfully",
                    otp: otp
                });
            }
        });
});

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
                    if (docs.profile !== null) {
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

});

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
                            message: "Auth Failed"
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
                            message: "Invalid Password"
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
router.get("/generatecsv", (req, res, next) => {
    var filePath = "public/teachers/teachers.csv";
    fs.access(filePath, fs.constants.F_OK, (error) => {
        if (error) {
            Teachers.find().exec()
                .then(docs => {
                    if (docs.length < 1) {
                        res.status(404).json({
                            message: "No Teachers Found"
                        })
                    } else {
                        var csvWriter = createCsvWriter({
                            path: "public/teachers/teachers.csv",
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
                            .then(() => res.download(path.join(__dirname, "../../public/teachers/teachers.csv")))
                            .catch((error) => console.error(error));
                    }
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });
        } else {
            res.download(path.join(__dirname, "../../public/teachers/teachers.csv"));
        }
    });

});

router.get("/:id", checkAuth, (req, res, next) => {
    Teachers.findById(req.params.id).exec()
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

router.patch("/changeuserid", checkAuth, (req, res) => {
    var id = req.body.id;
    if (req.userData._id !== id) {
        res.status(401).json({
            message: "Invalid UserID"
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
                                    message: "Invalid UserID"
                                })
                            }
                            else {
                                bcrypt.compare(password, doc.password, (err, response) => {
                                    if (err) {
                                        res.status(401).json({
                                            message: "Auth Failed"
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
                                            message: "Invalid Password"
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

router.patch("/changepassword", checkAuth, (req, res) => {
    var id = req.body.id;
    if (req.userData._id !== id) {
        res.status(401).json({
            message: "Invalid UserID"
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
                            message: "Auth Failed"
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
                            message: "Invalid Password"
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