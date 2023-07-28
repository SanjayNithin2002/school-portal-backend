var mongoose = require('mongoose');

var classMessageSchema = mongoose.Schema({
    _id: mongoose.SchemaTypes.ObjectId,
    class: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Classes',
        required: true
    },
    message: String,
    postedBy : {
        type : mongoose.SchemaTypes.ObjectId,
        ref : 'Teachers',
        required : true
    },
    postedOn : Date
});

module.exports = mongoose.model("ClassMessages", classMessageSchema);