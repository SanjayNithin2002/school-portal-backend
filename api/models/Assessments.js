var mongoose = require('mongoose');

var assessmentSchema = mongoose.Schema({
    _id : mongoose.SchemaTypes.ObjectId,
    class : {
        type : mongoose.SchemaTypes.ObjectId,
        ref : "Classes",
        required : true
    },
    maxMarks : Number,
    weightageMarks : Number,
    postedOn : Date,
    lastDate : Date,
    title : String,
    description : String,
    questionPaper : String
});

module.exports = mongoose.model("Assessments", assessmentSchema);