const Teachers = require('../models/Teachers');
const Admins = require('../models/Admins');
const Students = require('../models/Students');
const StudentAttendance = require('../models/StudentAttendance');
const TeacherAttendance = require('../models/TeacherAttendance');
const AdminAttendance = require('../models/AdminAttendance');
const Leave = require('../models/Leave');
const Classes = require('../models/Classes');
const Exams = require('../models/Exams');
const Assessments = require('../models/Assessments');
const ClassMessages = require('../models/ClassMessages');
const Marks = require('../models/Marks');
const PersonalMessages = require('../models/PersonalMessages');
const express = require('express');
const json2csv = require('json2csv').parse;
const fs = require('fs');
const path = require('path');
const Answers = require('../models/Answers');
const router = express.Router();

// storing Mark records as a CSV file
router.get('/getMarks', (req, res) => {
    Marks.find().populate([{ path: "assessment", select: "class title description maxmarks weightageMarks", populate: { path: "class", select: "subject" } }, { path: "exam", select: "class examName maxMarks weightageMarks", populate: { path: "class", select: "standard section subject" } }, { path: "student", select: "firstName lastName userID standard section" }]).exec()
        .then(docs => {
            const jsonData = docs.map(doc => {
                return {
                    firstName: doc.student.firstName,
                    lastname: doc.student.lastname,
                    userID: doc.student.userID,
                    standard: doc.student.standard,
                    section: doc.student.section,
                    scoredMarks: doc.scoredMarks,
                    weightageScoredMarks: doc.weightageScoredMarks,
                    exam: doc.exam ? doc.exam.examName.name + doc.exam.examName.sequence : null,
                    assessment: doc.assessment ? doc.assessment.name : null,
                    subject: (doc.assessment ? (doc.assessment.class ? doc.assessment.class.subject : null) : null) || (doc.exam ? (doc.exam.class ? doc.exam.class.subject : null) : null),
                    maxMarks: (doc.assessment ? doc.assessment.maxMarks : null) || (doc.exam ? doc.exam.maxMarks : null),
                    weightageMarks: (doc.assessment ? doc.assessment.weightageMarks : null) || (doc.exam ? doc.exam.weightageMarks : null)
                }
            });
            const fields = [
                "firstName",
                "userID",
                "standard",
                "section",
                "scoredMarks",
                "weightageScoredMarks",
                "exam",
                "assessment",
                "subject",
                "maxMarks",
                "weightageMarks"
            ];
            const csv = json2csv(jsonData, { fields });
            const filepath = `public/csv/marks${Math.floor(Math.random() * 1001)}.csv`
            fs.writeFileSync(filepath, csv, 'utf-8')
            res.download(path.join(__dirname, `../../${filepath}`));
        })
        .catch(err => {
            res.status(500).json({
                error: err
            })
        });
});

// deleting all the temporary records such asAdminAttendances, TeacherAttendances, Assessments, Class Messages, Personal Messages, Marks, Exams, Classes, Answers, Leaves. 
// students who are in 12th grade, will updated to `null` standard and section. 
// students who are in grade less than 12, their standards would be incremented and section will be set as null.
// teachers and admins leaves would be set to 12.

router.post('/', (req, res) => {
    const updateData = {
        earnedLeave: 12,
        sickLeave: 12,
        casualLeave: 12
    };

    const deleteAdminAttendances = AdminAttendance.deleteMany({});
    const deleteTeacherAttendances = TeacherAttendance.deleteMany({});
    const deleteAssessments = Assessments.deleteMany({});
    const deleteClassMessages = ClassMessages.deleteMany({});
    const deletePersonalMessages = PersonalMessages.deleteMany({});
    const deleteMarks = Marks.deleteMany({});
    const deleteAnswers = Answers.deleteMany({});
    const deleteExams = Exams.deleteMany({});
    const deleteClasses = Classes.deleteMany({});
    const deleteLeaves = Leave.deleteMany({});
    const updateTeachers = Teachers.updateMany({}, updateData);
    const updateAdmins = Teachers.updateMany({}, updateData);
    const updatePassedOutStudents = Students.updateMany({standard: 12}, {standard: null, section: null});
    const updateStudents = Students.updateMany({standard: { $ne: null }}, {$inc: {standard: 1}, $set:{section: null}});

    Promise.all([deleteAdminAttendances, deleteTeacherAttendances, deleteAssessments,deleteClassMessages, deletePersonalMessages, deleteMarks, deleteExams, deleteClasses, deleteAnswers, deleteLeaves, updateTeachers, updateAdmins, updatePassedOutStudents, updateStudents])
        .then(results => {
            res.status(201).json({
                message: "Deleted AdminAttendances, TeacherAttendances, Assessments, Class Messages, Personal Messages, Marks, Exams, Classes, Answers, Leaves and Updated Teachers, Admins and Students"
            });
        })
        .catch(err => {
            console.error('Error deleting documents:', err);
            res.status(500).json({
                error: err
            });
        });

})

module.exports = router;