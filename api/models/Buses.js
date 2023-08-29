var mongoose = require('mongoose');

var busSchema = mongoose.Schema({
    _id: mongoose.SchemaTypes.ObjectId,
    busStopArea: String,
    busStops: [String]
});

module.exports = mongoose.model('Buses', busSchema);