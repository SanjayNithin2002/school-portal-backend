var mongoose = require('mongoose');
var Admins = require('../models/Admins');
var express = require('express');
var router = express.Router();
var nodemailer = require("nodemailer");
var bcrypt = require("bcrypt");
var fs = require('fs');
var path = require('path');
var jwt = require("jsonwebtoken");
var checkAuth = require('../middleware/checkAuth');

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
    Admins.find({ email: req.body.email }).exec()
        .then(docs => {
            if (docs.length > 0) {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        res.status(500).json({
                            error: err
                        });
                    } else {
                        Admins.findByIdAndUpdate(docs[0]._id, { $set: { password: hash} }).exec()
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

router.post("/signup", checkAuth, (req, res, next) => {
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
            var admin = new Admins({
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
                qualification : req.body.qualification,
                experience: req.body.experience,
                address: {
                    line1: (req.body.address ? req.body.address.line1 : "NA"),
                    line2: (req.body.address  ? req.body.address.line2 : "NA"),
                    city: (req.body.address ? req.body.address.city : "NA"),
                    state: (req.body.address  ? req.body.address.state : "NA"),
                    pincode: (req.body.address ? req.body.address.pincode : 0)
                },
                phoneNumber: req.body.phoneNumber,
                salaryDetails: {
                    basic: (req.body.salaryDetails ? req.body.salaryDetails.basic : 0),
                    hra: (req.body.salaryDetails ? req.body.salaryDetails.hra : 0),
                    conveyance: (req.body.salaryDetails  ? req.body.salaryDetails.conveyance : 0),
                    pa: (req.body.salaryDetails  ? req.body.salaryDetails.pa : 0),
                    pf: (req.body.salaryDetails ? req.body.salaryDetails.pf : 0),
                    pt: (req.body.salaryDetails  ? req.body.salaryDetails.pt : 0),
                },
                busDetails: {
                    isNeeded: (req.body.busDetails  ? req.body.busDetails.isNeeded : false),
                    busStopArea: (req.body.busDetails  ? req.body.busDetails.busStopArea : "NA"),
                    busStop: (req.body.busDetails  ? req.body.busDetails.busStop : "NA"),
                    availableBus: (req.body.busDetails ? req.body.busDetails.availableBus : "NA")
                },
                hostelDetails: {
                    isNeeded: (req.body.hostelDetails  ? req.body.hostelDetails.isNeeded : false),
                    roomType: (req.body.hostelDetails ? req.body.hostelDetails.roomType : "NA"),
                    foodType: (req.body.hostelDetails  ? req.body.hostelDetails.foodType : "NA"),
                }
            });
            admin.save()
                .then(doc => {
                    var transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: process.env.NODEMAIL,
                            pass: process.env.NODEMAIL_PASSWORD
                        }
                    }).sendMail(mailOptions, function (error, info) {
                        if (error) {
                            res.status(500).json({
                                error: error
                            });
                        } else {
                            res.status(201).json({
                                message: "User Created and Mail Sent Successfully"
                            });
                        }
                    });
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
    Admins.find({ userID : req.body.userID}).exec()
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
                        res.status(200).json({
                            message: "Auth Successful",
                            docs: docs[0],
                            token: token
                        });
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
    Admins.find().exec()
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
    Admins.findById(req.params.id).exec()
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

router.get("generatecsv", checkAuth, (req, res, next) => {
    var filePath = "public/csv/admins.csv";
    fs.access(filePath, fs.varants.F_OK, (error) => {
        if (error) {
            Admins.find().exec()
                .then(docs => {
                    if (docs.length < 1) {
                        res.status(404).json({
                            message: "No Admins Found"
                        })
                    } else {
                        var csvWriter = createCsvWriter({
                            path: "public/csv/admins.csv",
                            header: [
                                { id: '_id', title: 'id' },
                                { id: 'name', title: 'Name' },
                                { id : 'empid', title: 'EmployeeID'},
                                { id: 'status', title: 'Status' }
                            ]
                        });
                        var adminArray = docs.map(doc => {
                            return {
                                _id : doc._id,
                                name: doc.firstName + " " + doc.lastName,
                                empid : doc.empid,
                                status: null

                            }
                        })
                        csvWriter
                            .writeRecords(adminArray)
                            .then(() => res.sendFile(path.join(__dirname, "../../public/csv/admins.csv")))
                            .catch((error) => console.error(error));
                    }
                })
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                });
        } else {
            res.sendFile(path.join(__dirname, "../../public/csv/admins.csv"));
        }
    });

});


router.patch("/changeuserid", checkAuth, (req, res, next) => {
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
        Admins.find({ userID: newUserID }).exec()
            .then(docs => {
                if (docs.length >= 1) {
                    res.status(409).json({
                        message: "User ID Already Exists"
                    })
                } else {
                    Admins.findById(id).exec()
                        .then(doc => {
                            if (doc === null) {
                                res.status(404).json({
                                    message: "Admin Not Found"
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
                                        Admins.findByIdAndUpdate(id, { userID: newUserID }).exec()
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
            message: "Invalid UserID"
        });
    } else {
        var id = req.body.id;
        var currentPassword = req.body.currentPassword;
        var newPassword = req.body.newPassword;
        Admins.findById(id).exec()
            .then(doc => {
                bcrypt.compare(currentPassword, doc.password, (err, response) => {
                    if (err) {
                        res.status(401).json({
                            message: "Auth Failed"
                        });
                    }
                    if (response) {
                        bcrypt.hash(newPassword, 10, (err, hash) => {
                            Admins.findByIdAndUpdate(id, { password: hash }).exec()
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
    Admins.findByIdAndUpdate(id, updateOps).exec()
        .then(docs => {
            res.status(200).json({
                message: "Admin Updated Successfully",
                docs: docs
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
    Admins.findByIdAndDelete(id).exec()
        .then(docs => {
            res.status(200).json({
                message: "Admin Deleted Successfully",
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