// Import required libraries and modules
var express = require("express"); // Express.js framework
var morgan = require("morgan"); // Logging middleware
var mongoose = require("mongoose"); // MongoDB ODM library
var bodyParser = require("body-parser"); // Middleware for parsing request bodies
var schedule = require('node-schedule'); // Schedule tasks
var cors = require('cors'); // Cross-origin resource sharing middleware

// Import route modules
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
var paymentRoutes = require('./api/routes/Payments');
var recordRoutes = require('./api/routes/Records');
var workerRoutes = require('./api/routes/Workers');
var spotlightRoutes = require('./api/routes/Spotlight');
var transactionRoutes = require('./api/routes/Transactions');
var feesRoutes = require('./api/routes/Fees');

// Create an Express application
var app = express();

// Schedule a job to clear directories at regular intervals
var clearDirectory = require('./api/middleware/clearDirectory');
var job = schedule.scheduleJob('*/5 * * * *', () => {
    clearDirectory('./assessments/');
    clearDirectory('./bonafides/');
    clearDirectory('./marks/');
    clearDirectory('./answers/');
    clearDirectory('./records/');
    clearDirectory('./attendances/');
    clearDirectory('./profiles/');
    console.log("Cleared Assessment, Bonafide, Marks, Attendances, Answers, and Profiles Directories");
});

// Middleware configuration
app.use(morgan("dev")); // Logging middleware for development
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(cors()); // Enable Cross-Origin Resource Sharing

// Configure CORS headers to allow requests from any origin
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Accept, Authorization, Content-Type"
    );
    if (req.method === 'OPTIONS') {
        res.header(
            "Access-Control-Allow-Methods",
            "PUT, POST, PATCH, DELETE, GET"
        );
        return res.status(200).json({});
    }
    next();
});

// Serve static files from the 'public' directory
app.use('/public', express.static('public'));

// Connect to MongoDB Atlas
mongoose.connect("mongodb+srv://sanjaynithin2002:" + process.env.MONGODB_PASSWORD + "@cluster0.kgz6ota.mongodb.net/?retryWrites=true&w=majority",
{
    dbName: process.env.school || "test"
});
console.log("Connected to MongoDB Atlas");

// Define routes for different API endpoints
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
app.use('/payments', paymentRoutes);
app.use('/records', recordRoutes);
app.use('/workers', workerRoutes);
app.use('/spotlight', spotlightRoutes);
app.use('/transactions', transactionRoutes);
app.use('/fees', feesRoutes);

// Define a root route that returns a welcome message
app.get('/', (req, res) => {
    res.status(200).json({
        message: "Welcome to School Management API"
    });
});

// Error handling middleware for "Not Found" errors
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

// Export the Express app for use in other modules
module.exports = app;
