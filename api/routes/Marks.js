var mongoose = require('mongoose');
var Marks = require('../models/Marks');
var Assessments = require('../models/Assessments');
var express = require('express');
var multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
var router = express.Router();
var checkAuth = require('../middleware/checkAuth');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./marks/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname)

    }
});

const fileFilter = (req, file, cb) => {
    //accept
    if (file.mimetype === 'text/csv') {
        cb(null, true);
    }
    //reject
    else {
        cb(null, false);
    }
}

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: fileFilter
});


router.get("/", checkAuth, (req, res) => {
    Marks.find().populate([{ path: "assessment", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.get("/:id", checkAuth, (req, res) => {
    Marks.findById(req.params.id).populate([{ path: "assessment", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(doc => {
            res.status(200).json({
                doc: doc
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.get("/students/:studentID", checkAuth, (req, res) => {
    Marks.find({ student: req.params.studentID }).populate([{ path: "assessment", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            });
        }
        )
        .catch(err => {
            res.status(500).json({
                error: err
            })
        }
        );
});

router.get("/assessments/:assessmentID", checkAuth, (req, res) => {
    Marks.find({ assessment: req.params.assessmentID }).populate([{ path: "assessment", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(docs => {
            res.status(200).json({
                docs: docs
            });
        }
        )
        .catch(err => {
            res.status(500).json({
                error: err
            })
        }
        );
});

router.post("/", checkAuth, (req, res) => {
    Assessments.findById(req.body.assessment).exec()
        .then(doc => {
            var maxMarks = doc.maxMarks;
            var weightageMarks = doc.weightageMarks;
            var scoredMarks = req.body.scoredMarks;
            var weightageScoredMarks = (scoredMarks / maxMarks) * weightageMarks;
            var mark = new Marks({
                _id: new mongoose.Types.ObjectId(),
                student: req.body.student,
                assessment: req.body.assessment,
                scoredMarks: scoredMarks,
                weightageScoredMarks: weightageScoredMarks,
                remarks: req.body.remarks
            });
            mark.save()
                .then(result => {
                    res.status(201).json({
                        message: "Mark Saved Successfully",
                        result: result
                    });
                }
                )
                .catch(err => {
                    res.status(500).json({
                        error: err
                    })
                }
                );
        })
});

router.post("/postmany", checkAuth, upload.single("marks"), (req, res) => {
    //receive student array and perform insert many operation
    Assessments.findById(req.body.assessment).exec()
        .then(doc => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (data) => {
                    var maxMarks = doc.maxMarks;
                    var weightageMarks = doc.weightageMarks;
                    var marks = [];
                    marks.push(data);
                    console.log(marks);
                    var marks = marks.map(mark => {
                        return {
                            _id: new mongoose.Types.ObjectId(),
                            student: mark.id,
                            assessment: req.body.assessment,
                            scoredMarks: mark.scoredMarks,
                            weightageScoredMarks: (mark.scoredMarks / maxMarks) * weightageMarks,
                            remarks: mark.Remarks
                        }
                    });
                    Marks.insertMany(marks)
                        .then(results => {
                            res.status(201).json({
                                message: "Marks Saved Successfully",
                                results: results
                            });
                        })
                        .catch(err => {
                            res.status(500).json({
                                error: err
                            })
                        });
                })
                .on('end', () => {
                    console.log('CSV file successfully processed');
                });
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.delete("/:id", checkAuth, (req, res) => {
    Marks.findByIdAndDelete(req.params.id).exec()
        .then(doc => {
            res.status(200).json({
                message: "Mark Deleted Successfully",
                doc: doc
            });
        }
        )
        .catch(err => {
            res.status(500).json({
                error: err
            })
        }
        );
});

module.exports = router;