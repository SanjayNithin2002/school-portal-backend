var mongoose = require('mongoose');
var Marks = require('../models/Marks');
var Assessments = require('../models/Assessments');
var express = require('express');
var multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
var router = express.Router();
var checkAuth = require('../middleware/checkAuth');
const Exams = require('../models/Exams');

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
    Marks.find().populate([{ path: "assessment", populate: { path: "class" } }, { path: "exam", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(docs => {
            var assessmentMarks = docs.filter(doc => doc.assessment != null);
            var examMarks = docs.filter(doc => doc.exam != null);
            res.status(200).json({
                docs: {
                    assessmentMarks: assessmentMarks,
                    examMarks: examMarks
                }
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.get("/:id", checkAuth, (req, res) => {
    Marks.findById(req.params.id).populate([{ path: "assessment", populate: { path: "class" } }, { path: "exam", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(doc => {
            res.status(200).json({
                docs: doc
            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

router.get("/students/:studentID", checkAuth, (req, res) => {
    Marks.find({ student: req.params.studentID }).populate([{ path: "assessment", populate: { path: "class" } }, { path: "exam", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(docs => {
            var assessmentMarks = docs.filter(doc => doc.assessment != null);
            var examMarks = docs.filter(doc => doc.exam != null);
            res.status(200).json({
                docs: {
                    assessmentMarks: assessmentMarks,
                    examMarks: examMarks
                }
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

router.get("/teachers/:teacherID", checkAuth, (req, res) => {
    var teacherID = req.params.teacherID;
    Marks.find().populate([{ path: "assessment", populate: { path: "class" } }, { path: "exam", populate: { path: "class" } }, { path: "student" }]).exec()
        .then(docs => {
            var assessmentMarks = docs.filter(doc => doc.assessment != null && doc.assessment.class.teacher == teacherID);
            var examMarks = docs.filter(doc => doc.exam != null && doc.exam.class.teacher == teacherID);
            res.status(200).json({
                docs: {
                    assessmentMarks: assessmentMarks,
                    examMarks: examMarks
                }
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

router.get("/exams/:examID", checkAuth, (req, res) => {
    Marks.find({ exam: req.params.examID }).populate([{ path: "exam", populate: { path: "class" } }, { path: "student" }]).exec()
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
    if (req.body.type === "assessment") {
        Assessments.findById(req.body.assessment).exec()
            .then(doc => {
                var maxMarks = doc.maxMarks;
                var weightageMarks = doc.weightageMarks;
                var scoredMarks = req.body.scoredMarks;
                var weightageScoredMarks = (scoredMarks / maxMarks) * weightageMarks;
                var mark = new Marks({
                    _id: new mongoose.Types.ObjectId(),
                    student: req.body.student,
                    [req.body.type]: req.body[req.body.type],
                    scoredMarks: scoredMarks,
                    weightageScoredMarks: weightageScoredMarks,
                    remarks: req.body.remarks
                });
                mark.save()
                    .then(result => {
                        res.status(201).json({
                            message: "Mark Saved Successfully",
                            docs: result
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
    }
    if (req.body.type === "exam") {
        Exams.findById(req.body.exam).exec()
            .then(doc => {
                var maxMarks = doc.maxMarks;
                var weightageMarks = doc.weightageMarks;
                var scoredMarks = req.body.scoredMarks;
                var weightageScoredMarks = (scoredMarks / maxMarks) * weightageMarks;
                var mark = new Marks({
                    _id: new mongoose.Types.ObjectId(),
                    student: req.body.student,
                    [req.body.type]: req.body[req.body.type],
                    scoredMarks: scoredMarks,
                    weightageScoredMarks: weightageScoredMarks,
                    remarks: req.body.remarks
                });
                mark.save()
                    .then(result => {
                        res.status(201).json({
                            message: "Mark Saved Successfully",
                            docs: result
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
    }
});

router.post("/postmany/fileupload", checkAuth, upload.single("marks"), (req, res) => {
    //receive student array and perform insert many operation
    if (req.body.type === "assessment") {
        Assessments.findById(req.body.assessment).exec()
            .then(doc => {
                var marks = [];
                var maxMarks = doc.maxMarks;
                var weightageMarks = doc.weightageMarks;
                fs.createReadStream(req.file.path)
                    .pipe(csv())
                    .on('data', (data) => {


                        marks.push(data);
                    })
                    .on('end', () => {
                        console.log('CSV file successfully processed');
                        console.log(marks);
                        Marks.insertMany(marks.map(mark => {
                            return {
                                _id: new mongoose.Types.ObjectId(),
                                student: mark.id,
                                [req.body.type]: req.body[req.body.type],
                                scoredMarks: mark.scoredMarks,
                                weightageScoredMarks: (mark.scoredMarks / maxMarks) * weightageMarks,
                                remarks: mark.Remarks
                            }
                        }))
                            .then(results => {
                                res.status(201).json({
                                    message: "Marks Saved Successfully",
                                    docs: results
                                });
                            })
                            .catch(err => {
                                res.status(500).json({
                                    error: err
                                })
                            });
                    });
            }).catch(err => {
                res.status(500).json({
                    error: err
                })
            });
    }
    if (req.body.type === "exam") {
        Exams.findById(req.body.exam).exec()
            .then(doc => {
                var marks = [];
                var maxMarks = doc.maxMarks;
                var weightageMarks = doc.weightageMarks;
                fs.createReadStream(req.file.path)
                    .pipe(csv())
                    .on('data', (data) => {
                        marks.push(data);
                    })
                    .on('end', () => {
                        console.log('CSV file successfully processed');
                        console.log(marks);
                        Marks.insertMany(marks.map(mark => {
                            return {
                                _id: new mongoose.Types.ObjectId(),
                                student: mark.id,
                                [req.body.type]: req.body[req.body.type],
                                scoredMarks: mark.scoredMarks,
                                weightageScoredMarks: (mark.scoredMarks / maxMarks) * weightageMarks,
                                remarks: mark.Remarks
                            }
                        }))
                            .then(results => {
                                res.status(201).json({
                                    message: "Marks Saved Successfully",
                                    docs: results
                                });
                            })
                            .catch(err => {
                                res.status(500).json({
                                    error: err
                                })
                            });
                    });
            }).catch(err => {
                res.status(500).json({
                    error: err
                })
            });

    }

});

router.post("/postmany", (req, res) => {
    if (req.body.type === "assessment") {
        Assessments.findById(req.body.assessment).exec()
            .then(doc => {
                var marks = [];
                var maxMarks = doc.maxMarks;
                var weightageMarks = doc.weightageMarks;
                Marks.insertMany(req.body.marks.map(mark => {
                    return {
                        _id: new mongoose.Types.ObjectId(),
                        student: mark.id,
                        [req.body.type]: req.body[req.body.type],
                        scoredMarks: mark.scoredMarks,
                        weightageScoredMarks: (mark.scoredMarks / maxMarks) * weightageMarks,
                        remarks: mark.Remarks
                    }
                }))
                    .then(results => {
                        res.status(201).json({
                            message: "Marks Saved Successfully",
                            docs: results
                        });
                    })
                    .catch(err => {
                        res.status(500).json({
                            error: err
                        })
                    });
            });
    }
    if (req.body.type === "exam") {
        Exams.findById(req.body.exam).exec()
            .then(doc => {
                var maxMarks = doc.maxMarks;
                var weightageMarks = doc.weightageMarks;
                Marks.insertMany(marks.map(mark => {
                    return {
                        _id: new mongoose.Types.ObjectId(),
                        student: mark.id,
                        [req.body.type]: req.body[req.body.type],
                        scoredMarks: mark.scoredMarks,
                        weightageScoredMarks: (mark.scoredMarks / maxMarks) * weightageMarks,
                        remarks: mark.Remarks
                    }
                }))
                    .then(results => {
                        res.status(201).json({
                            message: "Marks Saved Successfully",
                            docs: results
                        });
                    })
                    .catch(err => {
                        res.status(500).json({
                            error: err
                        })
                    });
            });
    }
});


router.patch("/:id", checkAuth, (req, res) => {
    var updateOps = {};
    for (const ops of req.body) {
        updateOps[ops.propName] = ops.value;
    }
    Marks.findByIdAndUpdate(req.params.id, updateOps).exec()
        .then(doc => {
            res.status(200).json({
                message: "Marks Updated",
                docs: doc
            })

        }).catch(err => {
            res.status(500).json({
                error: err
            })
        });
})

router.delete("/:id", checkAuth, (req, res) => {
    Marks.findByIdAndDelete(req.params.id).exec()
        .then(doc => {
            res.status(200).json({
                message: "Mark Deleted Successfully",
                docs: doc
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