var nodemailer = require('nodemailer');
var express = require('express');
var router = express.Router();
var checkAuth = require('../middleware/checkAuth');

/* The code `router.post("/", checkAuth, (req, res, next) => { ... })` is defining a route handler for
a POST request to the root URL ("/"). */
router.post("/", checkAuth, (req, res, next) => {
    var mailOptions = {
        from: req.body.email,
        to: "sanjay.nithin19@gmail.com",
        subject: req.body.subject,
        text: "Name : " + req.body.name + "\nEmail : " + req.body.email + "\nSubject : " + req.body.subject + "\nMessage : " + req.body.message
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
                    message: "Mail Sent Successfully"
                });
            }
        });
});

module.exports = router;