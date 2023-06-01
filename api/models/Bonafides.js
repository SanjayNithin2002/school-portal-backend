var mongoose = require('mongoose');

var bonafideSchema = mongoose.Schema({
    _id : mongoose.SchemaTypes.ObjectId,
    student : {
        type : mongoose.SchemaTypes.ObjectId,
        ref : "Students",
        required : true
    },
    service : String,
    passport : {
        description : String
    },
    visa : {
        fromDate : String,
        toDate : String,
        place : String,
        description : String
    },
    buspass : {
        description : String
    },
    incomeTax : {
        employee : String,
        description : String
    },
    NCCBonafide : {
        description : String
    },
    tc : {
        description : String
    },
    requestedFile : {
        type : String,
        default : null
    },
    postedOn : Date,
    status : {
        type : String,
        default : "Pending"
    },
    message : {
        type : String,
        default : null
    }
});

module.exports = mongoose.model("Bonafides", bonafideSchema);