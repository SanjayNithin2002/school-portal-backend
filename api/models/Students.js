var mongoose = require('mongoose');

var studentSchema = mongoose.Schema({
    _id: mongoose.SchemaTypes.ObjectId,
    password : {
        type : String, 
        required : true
    },
    email : String,
    userID : {
        type : String,
        required : true,
        unique : true
    },
    applicationNumber : {
        type : String,
        required : true,
        unique : true
    },
    standard : Number,
    section : String,
    firstName : String,
    lastName : String,
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
        pincode : String
    },
    father : {
        name : String,
        age : Number,
        qualification : String,
        occupation : String,
        annualIncome : Number,
        phoneNumber : String,
        email : String
    },
    mother : {
        name : String,
        age : Number,
        qualification : String,
        occupation : String,
        annualIncome : Number,
        phoneNumber : String,
        email : String
    },
    guardian : {
        name : String,
        age : Number,
        qualification : String,
        occupation : String,
        annualIncome : Number,
        phoneNumber : String,
        email : String
    },
    profile: {
        type: String,
        default: null
    }
});

module.exports = mongoose.model("Students", studentSchema);