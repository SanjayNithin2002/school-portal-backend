var mongoose = require('mongoose');

var recordSchema = mongoose.Schema({
    _id : mongoose.SchemaTypes.ObjectId,
    date : Date,
    title: String,
    document : String
});

module.exports = mongoose.model("Records", recordSchema);