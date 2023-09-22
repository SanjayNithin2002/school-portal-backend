var mongoose = require('mongoose');

var workerSchema = mongoose.Schema({
    _id: mongoose.SchemaTypes.ObjectId,
    email : String,
    firstName : String,
    lastName : String,
    empID : {
        type : String,
        required : true,
        unique : true
    },
    dob : Date,
    gender : String,
    bloodGroup : String,
    aadharNumber : String,
    motherTongue : String,
    address : {
        line1 : String,
        line2 : String,
        city : String,
        state : String,
        pincode : Number
    },
    phoneNumber : String,
    designation : String,
    experience : Number,
    salaryDetails : {
        basic : Number,
        hra : Number,
        conveyance : Number,
        pa : Number,
        pf : Number,
        pt : Number,
    }
});

module.exports = mongoose.model("Workers", workerSchema);