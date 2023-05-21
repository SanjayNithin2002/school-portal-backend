var mongoose = require("mongoose");

var answerSchema = new mongoose.Schema({
    _id : mongoose.Schema.Types.ObjectId,
    assessment : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Assessments",
        required : true
    },
    student : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Students",
        required : true
    },
    answerFile : String
});

module.exports = mongoose.model("Answers", answerSchema);