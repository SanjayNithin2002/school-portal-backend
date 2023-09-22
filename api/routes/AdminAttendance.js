var mongoose = require('mongoose');
var express = require('express');
var router = express.Router();
var AdminAttendance = require('../models/AdminAttendance');
var checkAuth = require('../middleware/checkAuth');

/**
 * The function `deleteMultipleRecords` deletes multiple records from the AdminAttendance collection in
 * a MongoDB database.
 * @param updatesArray - The `updatesArray` parameter is an array of objects that contain the updates
 * to be made. Each object in the array represents a record to be deleted and should have a property
 * `_id` which represents the unique identifier of the record to be deleted.
 */
async function deleteMultipleRecords(updatesArray) {
    var updatePromises = updatesArray.map(async (update) => {
        try {
            var result = await AdminAttendance.findByIdAndDelete(update);
            return result;
        } catch (error) {
            console.error(`Error deleting document with _id ${update._id}:`, error);
        }
    });

    var results = await Promise.all(updatePromises);
    console.log('Documents deleted successfully:', results);
}

/**
 * The function `updateMultipleRecords` updates multiple records in the `AdminAttendance` collection
 * based on the provided `updatesArray`.
 * @param updatesArray - The `updatesArray` parameter is an array of objects. Each object represents an
 * update operation for a document in the `AdminAttendance` collection. The objects in the array should
 * have the following structure:
 */
async function updateMultipleRecords(updatesArray) {
    var updatePromises = updatesArray.map(async (update) => {
        try {
            var { _id, ...updateData } = update;
            var result = await AdminAttendance.updateOne({ _id }, updateData);
            return result;
        } catch (error) {
            console.error(`Error updating document with _id ${update._id}:`, error);
        }
    });

    var results = await Promise.all(updatePromises);
    console.log('Documents updated successfully:', results);
}

/* This code is defining a GET route for the root URL ("/") of the server. When a GET request is made
to this route, it will execute the `checkAuth` middleware function to check if the user is
authenticated. If the user is authenticated, it will execute the callback function `(req, res) =>
{...}`. */
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


/* This code defines a GET route for the URL "/:id" of the server. When a GET request is made to this
route, it will execute the `checkAuth` middleware function to check if the user is authenticated. If
the user is authenticated, it will execute the callback function `(req, res) => {...}`. */
router.get("/:id", checkAuth, (req, res) => {
    AdminAttendance.findById(req.params.id).exec()
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

/* This code defines a GET route for the URL "/admins/:adminID" of the server. When a GET request is
made to this route, it will execute the `checkAuth` middleware function to check if the user is
authenticated. If the user is authenticated, it will execute the callback function `(req, res) =>
{...}`. */
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


/* This code defines a GET route for the URL "/date/:date" of the server. When a GET request is made to
this route, it will execute the `checkAuth` middleware function to check if the user is
authenticated. If the user is authenticated, it will execute the callback function `(req, res) =>
{...}`. */
router.get("/date/:date", checkAuth, (req, res) => {
    AdminAttendance.find({ date: new Date(req.params.date) }).populate('admin').exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            })
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

/* The code `router.post("/", checkAuth, (req, res) => {...})` defines a POST route for the root URL
("/") of the server. */
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

/* The `router.post("/postmany", checkAuth, (req, res) => {...})` function is defining a POST route for
the URL "/postmany" of the server. */
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

/* The code `router.patch('/patchmany', checkAuth, async (req, res) => {...})` defines a PATCH route
for the URL "/patchmany" of the server. */
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

/* The code `router.patch("/deletemany", async (req, res) => {...})` defines a PATCH route for the URL
"/deletemany" of the server. When a PATCH request is made to this route, it will execute the
callback function `(req, res) => {...}`. */
router.patch("/deletemany", async (req, res) => {
    try {
        var results = await deleteMultipleRecords(req.body);
        res.status(200).json({
            message: 'Deleted the admin attendances records',
            docs: results,
        });
    } catch (err) {
        res.status(500).json({
            error: err.message || 'Internal server error',
        });
    }
});

/* The code `router.patch("/:id", checkAuth, (req, res) => {...})` defines a PATCH route for the URL
"/:id" of the server. When a PATCH request is made to this route, it will execute the callback
function `(req, res) => {...}`. */
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

/* The code `router.delete("/:id", checkAuth, (req, res) => {...})` defines a DELETE route for the URL
"/:id" of the server. When a DELETE request is made to this route, it will execute the callback
function `(req, res) => {...}`. */
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