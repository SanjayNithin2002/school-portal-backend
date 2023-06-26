var mongoose = require('mongoose');
var Extracurricular = require('../models/Extracurricular');
var Payments = require('../models/Payments');
var timeToString = require('../middleware/timeToString');
var checkAuth = require('../middleware/checkAuth');
var express = require('express');
var router = express.Router();

router.get("/", checkAuth, (req, res) => {
    Extracurricular.find().populate("students").exec()
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

router.get("/:id", checkAuth, (req, res) => {
    Extracurricular.findById(req.params.id).populate("students").exec()
        .then(doc => {
            res.status(200).json({
                doc: doc
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.post("/", checkAuth, (req, res) => {
    var extracurricular = new Extracurricular({
        _id: new mongoose.Types.ObjectId(),
        title: req.body.title,
        duration: req.body.duration,
        paymentDue: req.body.paymentDue,
        timings: req.body.timings.map(timing => {
            return {
                startTime: timeToString(timing.startTime),
                endTime: timeToString(timing.endTime),
                day: timing.day
            }
        }),
        fees : req.body.fees,
        students: []
    });
    extracurricular.save()
        .then(docs => {
            res.status(200).json({
                message: "Extracurricular Class Posted",
                docs: docs
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.patch("/:id", checkAuth, (req, res) => {
    var id = req.params.id;
    var updateOps = {};
    for (const ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Extracurricular.findByIdAndUpdate(id, updateOps).exec()
        .then(doc => {
            res.status(200).json({
                message: "Extracurricular Class Patched",
                docs: docs,
                payment: newDocs
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});
router.patch("/:id/addstudent/:studentID", checkAuth, (req, res) => {
    Extracurricular.findByIdAndUpdate(req.params.id, { $push: { students: req.params.studentID } }).exec()
      .then(doc => {
        var payment = new Payments({
          _id: new mongoose.Types.ObjectId(),
          amount: doc.fees,
          due: new Date(doc.paymentDue),
          status: "Pending",
          student: req.params.studentID
        });
  
        console.log(payment);
  
        payment.save()
          .then(newDocs => {
            res.status(200).json({
              message: "Student Added",
              doc: doc, 
              payment: newDocs
            });
          }).catch(err => {
            console.error("Error saving payment:", err); 
            res.status(500).json({
              error: err.message
            });
          });
      }).catch(err => {
        console.error("Error updating extracurricular:", err); 
        res.status(500).json({
          error: err.message 
        });
      });
  });
  

router.delete("/:id", checkAuth, (req, res) => {
    Extracurricular.findByIdAndDelete(req.params.id).exec()
        .then(docs => {
            res.status(200).json({
                message: "Extracurricular Class Deleted",
                docs: docs
            })
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

module.exports = router;