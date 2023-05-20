var mongoose = require('mongoose');
var adminAttendanceSchema = mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    admin : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Admins',
        required : true
    },
    date : Date,
    status : String
});

module.exports = mongoose.model('AdminAttendances', adminAttendanceSchema);