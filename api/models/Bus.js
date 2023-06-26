var mongoose = require('mongoose');

var busSchema = mongoose.Schema({
    _id: mongoose.SchemaTypes.ObjectId,
    busNumber: String,
    stops: [{
        stopName: String,
        landmark: String,
        pickUpTime: String,
        dropTime: String,
        fees: Number,
    }],
    availableSeats: Number,
    maxSeats: Number
});

module.exports = mongoose.model('Buses', busSchema);