var express = require('express');
var mongoose = require('mongoose');
var Razorpay = require('razorpay');
var shortid = require('shortid');
var crypto = require('crypto');
var Transactions = require('../models/Transactions');
var Payments = require('../models/Payments');
var checkAuth = require('../middleware/checkAuth');
var router = express.Router();

/* The code `var razorpay = new Razorpay({ key_id: process.env.rpy_key, key_secret:
process.env.rpy_key_secret });` is creating a new instance of the Razorpay object. It is using the
`Razorpay` module and passing in the `key_id` and `key_secret` values from the environment variables
`process.env.rpy_key` and `process.env.rpy_key_secret` respectively. These values are used to
authenticate and authorize the API requests made to the Razorpay payment gateway. */
var razorpay = new Razorpay({
    key_id: process.env.rpy_key,
    key_secret: process.env.rpy_key_secret
});

/* This code is defining a GET route for the root URL ("/"). It is using the Express router to handle
the request. */
router.get("/", checkAuth, (req, res) => {
    Transactions.find().exec()
        .then(docs => {
            docs = docs.filter(doc => doc.transation != null);
            res.status(200).json({
                docs: docs
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* This code defines a GET route with a dynamic parameter `/:id`. It uses the Express router to handle
the request. */
router.get("/:id", checkAuth, (req, res) => {
    Transactions.findById(req.params.id).exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The code `router.get("/students/:studentID", checkAuth, (req, res) => { ... })` defines a GET route
with a dynamic parameter `/:studentID`. This route is used to fetch transactions related to a
specific student. */
router.get("/students/:studentID", checkAuth, (req, res) => {
    Transactions.find().populate('paymentID').exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            });
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});


/* The code `router.post("/razorpay", checkAuth, async (req, res) => { ... })` defines a POST route for
the "/razorpay" endpoint. This route is used to create a new Razorpay order and initiate a payment. */
router.post("/razorpay", checkAuth, async (req, res) => {
    var paymentID = req.body.payment;
    Payments.findById(paymentID).populate('fees').exec()
        .then(async (docs) => {
            try {
                const options = {
                    amount: docs.fees.amount * 100,
                    currency: "INR",
                    receipt: shortid.generate(),
                    partial_payment: false
                }
                const response = await razorpay.orders.create(options);
                var transaction = await new Transactions({
                    _id: new mongoose.Types.ObjectId(),
                    paymentID: paymentID,
                    orderID: response.id,
                    transaction: null
                });
                await transaction.save()
                    .then(docs => {
                        res.status(201).json(response);
                    })
                    .catch(err => {
                        res.status(500).json({
                            error: err
                        })
                    });

            } catch (err) {
                res.status(500).json({
                    error: err
                })
            }
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The `router.post('/verification', async (req, res) => { ... })` code defines a POST route for the
"/verification" endpoint. This route is used to handle the verification of a payment webhook from
Razorpay. */
router.post('/verification', async (req, res) => {
    const secret = process.env.rpy_webhook_secret;
    const shasum = crypto.createHmac('sha256', secret)
    shasum.update(JSON.stringify(req.body))
    const digest = shasum.digest('hex')
    if (digest === req.headers['x-razorpay-signature']) {
        Transactions.updateMany({ orderID: req.body.payload.payment.entity.order_id }, { transaction: req.body.payload.payment.entity }).exec()
            .then(docs => {
                Transactions.find({ orderID: req.body.payload.payment.entity.order_id }).exec()
                    .then(docs => {
                        Payments.findByIdAndUpdate(docs[0].paymentID.toString(), { status: "Successful" }).exec()
                            .then(docs => {
                                res.json({
                                    status: 'ok'
                                });
                            }).catch(err => {
                                res.json({
                                    status: 'ok'
                                });
                            });
                    }).catch(err => {
                        res.json({
                            status: 'ok'
                        });
                    });
            }).catch(err => {
                res.json({
                    status: 'ok'
                })
            });
    } else {
        res.json({
            status: 'ok'
        })
    }
});

module.exports = router;