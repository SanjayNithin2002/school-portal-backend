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
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.client_x509_cert_url,
    universe_domain: "googleapis.com"
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.BUCKET_URL
});

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
                                console.log("hi");
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