var mongoose = require('mongoose');

var paymentSchema = mongoose.Schema({
    _id : mongoose.SchemaTypes.ObjectId,
    fees: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Fees'
    },
    status : String,
    student : {
        type : mongoose.SchemaTypes.ObjectId,
        ref : 'Students'
    }
});

module.exports = mongoose.model("Payments", paymentSchema);