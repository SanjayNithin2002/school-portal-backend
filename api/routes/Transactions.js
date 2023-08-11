var express = require('express');
var mongoose = require('mongoose');
var Razorpay = require('razorpay');
var shortid = require('shortid');
var crypto = require('crypto');
var Transactions = require('../models/Transactions');
var Payments = require('../models/Payments');
var checkAuth = require('../middleware/checkAuth');
var router = express.Router();

var razorpay = new Razorpay({
    key_id: process.env.rpy_key,
    key_secret: process.env.rpy_key_secret
});
router.get("/", (req, res) => {
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

router.get("/:id", (req, res) => {
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

router.get("/students/:studentID", (req, res) => {
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


router.post("/razorpay", async (req, res) => {
    var paymentID = req.body.payment;
    Payments.findById(paymentID).exec()
        .then(async (docs) => {
            try {
                const options = {
                    amount: docs.amount * 100,
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