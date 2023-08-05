var mongoose = require('mongoose');
var spotlightSchemma = mongoose.Schema({
    _id : mongoose.SchemaTypes.ObjectId,
    title : String,
    description : String,
    users : String, 
    postedOn : Date
});

module.exports = mongoose.model("Spotlight", spotlightSchemma);