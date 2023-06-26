var mongoose = require('mongoose');

var leaveSchema = mongoose.Schema({
    _id : mongoose.SchemaTypes.ObjectId,
    user : {
        type : String
    },
    admin : {
        type : mongoose.SchemaTypes.ObjectId,
        ref : 'Admins'
    },
    teacher : {
        type : mongoose.SchemaTypes.ObjectId,
        ref : 'Teachers'
    },
    startDate : {
        type : Date
    },
    endDate : {
        type : Date
    },
    reason : {
        type : String
    },
    status : {
        type : String,
        default : "Pending"
    },
    postedOn : Date,
    type : String
});
 
module.exports = mongoose.model("Leave", leaveSchema);
