var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var AdminAttendance = require('../models/AdminAttendance');
var checkAuth = require('../middleware/checkAuth');

async function updateMultipleRecords(updatesArray) {
    var updatePromises = updatesArray.map(async (update) => {
        try {
            var { _id, ...updateData } = update;
            var result = await AdminAttendance.updateOne({ _id }, updateData);
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

router.get("/", checkAuth, (req, res) => {
    AdminAttendance.find().exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            })
        }
        ).catch(err => {
            res.status(500).json({
                error: err
            })
        }
        )
});
router.get("/:id", checkAuth, (req, res) => {
    AdminAttendance.findById(req.params.id).exec()
        .then(docs => {
            res.status(200).json({
                docs : docs
            })
        }
        ).catch(err => {
            res.status(500).json({
                error: err
            })
        }
        )
});
router.get("/admins/:adminID", checkAuth, (req, res) => {
    AdminAttendance.find({ admin: req.params.adminID }).exec()
        .then(docs => {
            res.status(200).json({
               docs: docs
            })
        }
        ).catch(err => {
            res.status(500).json({
                error: err
            })
        }
        )
});

router.post("/", checkAuth, (req, res) => {
    var adminAttendance = new AdminAttendance({
        _id: new mongoose.Types.ObjectId(),
        admin: req.body.admin,
        date: req.body.date,
        time: req.body.time,
        status: req.body.status
    });
    adminAttendance.save().then(result => {
        res.status(200).json({
            message: "AdminAttendance Created Successfully",
            docs: result
        })
    }).catch(err => {
        res.status(500).json({
            error: err
        })
    })

});
  
router.post("/postmany", checkAuth, (req, res) => {
    var date = req.body.date;
    var time = req.body.time;
    var attendances = req.body.attendances;
    var adminAttendances = attendances.map(attendance => {
        return new AdminAttendance({
            _id: new mongoose.Types.ObjectId(),
            admin: attendance.admin,
            date: date,
            time: time,
            status: attendance.status
        })
    }
    );
    AdminAttendance.insertMany(adminAttendances).then(result => {
        res.status(201).json({
            message: "AdminAttendances Created Successfully",
            docs: result
        })
    }
    ).catch(err => {
        res.status(500).json({
            error: err
        })
    }
    )
});

router.patch('/patchmany', checkAuth, async (req, res) => {
    try {
        var results = await updateMultipleRecords(req.body);

        res.status(200).json({
            message: 'Updated the admin attendances records',
            docs: results,
        });
    } catch (err) {
        res.status(500).json({
            error: err.message || 'Internal server error',
        });
    }
});

router.patch("/:id", checkAuth, (req, res) => {
    var updateOps = {};
    for (var ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    AdminAttendance.findByIdAndUpdate(req.params.id, updateOps).exec()
        .then(doc => {
            res.status(200).json({
                message: "Admin Attendance Updated",
                docs: doc
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.delete("/:id", checkAuth, (req, res) => {
    AdminAttendance.findByIdAndDelete(req.params.id).exec()
        .then(docs => {
            res.status(200).json({
                message: "AdminAttendance Deleted Successfully"
            })
        }
        ).catch(err => {
            res.status(500).json({
                error: err
            })
        }
        )
});

module.exports = router;