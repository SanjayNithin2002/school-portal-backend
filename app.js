var express = require("express");
var morgan = require("morgan");
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var schedule = require('node-schedule');
var cors = require('cors');


//importing routes
var classRoutes = require('./api/routes/Classes');
var studentRoutes = require('./api/routes/Students');
var teacherRoutes = require('./api/routes/Teachers');
var adminRoutes = require('./api/routes/Admins');
var leaveRoutes = require('./api/routes/Leave');
var classMessageRoutes = require('./api/routes/ClassMessages');
var examRoutes = require('./api/routes/Exams');
var assesssmentRoutes = require('./api/routes/Assessments');
var bonafideRoutes = require('./api/routes/Bonafides');
var sendEmailRoutes = require('./api/routes/SendEmail');
var marksRoutes = require('./api/routes/Marks');
var adminAttendanceRoutes = require('./api/routes/AdminAttendance');
var teacherAttendanceRoutes = require('./api/routes/TeacherAttendance');
var studentAttendanceRoutes = require('./api/routes/StudentAttendance');
var downloadFileRoutes = require('./api/routes/DownloadFile');
var answerRoutes = require('./api/routes/Answers');
var personalMessagesRoutes = require('./api/routes/PersonalMessages');
var timetableRoutes = require('./api/routes/Timetable');
var busRoutes = require('./api/routes/Buses');
var paymentRoutes = require('./api/routes/Payments');
var recordRoutes = require('./api/routes/Records');
var workerRoutes = require('./api/routes/Workers');
var spotlightRoutes = require('./api/routes/Spotlight');
var transactionRoutes = require('./api/routes/Transactions');
var feesRoutes = require('./api/routes/Fees');

var app = express();

//Schedule Job to clear Assessment and Bonafide Directories

var clearDirectory = require('./api/middleware/clearDirectory');
var job = schedule.scheduleJob('*/5 * * * *', () => {
    clearDirectory('./assessments/');
    clearDirectory('./bonafides/');
    clearDirectory('./marks/')
    clearDirectory('./answers/')
    clearDirectory('./records/')
    clearDirectory('./attendances/')
    console.log("Cleared Assessment, Bonafide, Marks, Attendances and Answers Directories");
});

//Middleware
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());


app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Accept, Authorization, Content-Type");
    if (req.method === 'OPTIONS') {
        res.header(
            "Access-Control-Allow-Methods",
            "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }
    next();
});

app.use('/public', express.static('public'));

//Mongo DB connection
mongoose.connect("mongodb+srv://sanjaynithin2002:" + process.env.MONGODB_PASSWORD + "@cluster0.kgz6ota.mongodb.net/?retryWrites=true&w=majority")
console.log("Connected to MongoDB Atlas");
//routes
app.use('/classes', classRoutes);
app.use('/students', studentRoutes);
app.use('/teachers', teacherRoutes);
app.use('/admins', adminRoutes);
app.use('/leaves', leaveRoutes);
app.use('/classmessages', classMessageRoutes);
app.use('/exams', examRoutes);
app.use('/assessments', assesssmentRoutes);
app.use('/bonafides', bonafideRoutes);
app.use('/sendmail', sendEmailRoutes);
app.use('/marks', marksRoutes);
app.use('/adminattendances', adminAttendanceRoutes);
app.use('/teacherattendances', teacherAttendanceRoutes);
app.use('/studentattendances', studentAttendanceRoutes);
app.use('/downloadfile', downloadFileRoutes);
app.use('/answers', answerRoutes);
app.use('/personalmessages', personalMessagesRoutes);
app.use('/timetables', timetableRoutes);
app.use('/buses', busRoutes);
app.use('/payments', paymentRoutes);
app.use('/records', recordRoutes);
app.use('/workers', workerRoutes);
app.use('/spotlight', spotlightRoutes);
app.use('/transactions', transactionRoutes);
app.use('/fees', feesRoutes);
app.get('/', (req, res) => {
    res.status(200).json({
        message: "Welcome to School Management API"
    });
});

// handling "Not Found" errors
app.use((req, res, next) => {
    var error = new Error("Not Found");
    error.status = 404;
    next(error);
});
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

module.exports = app;

