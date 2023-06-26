var mongoose = require("mongoose");

var hostelRoomSchema = mongoose.Schema({
    _id : mongoose.SchemaTypes.ObjectId,
    type : String, 
    available : Number,
    maximum : Number,
    fees : Number,
    students : [{
        type : mongoose.SchemaTypes.ObjectId,
        ref : 'Students'
    }]
});

module.exports = mongoose.model('HostelRooms', hostelRoomSchema);