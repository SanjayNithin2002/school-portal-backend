var mongoose = require('mongoose');
var teacherAttendanceSchema = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    teacher : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Teachers',
        required : true
    },
    date : Date,
    status : String
});

module.exports = mongoose.model('TeacherAttendances', teacherAttendanceSchema);
