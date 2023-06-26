var mongoose = require('mongoose');

var paymentSchema = mongoose.Schema({
    _id : mongoose.SchemaTypes.ObjectId,
    amount : Number, 
    due : Date,
    status : String,
    student : {
        type : mongoose.SchemaTypes.ObjectId,
        ref : 'Students'
    }
});

module.exports = mongoose.model("Payments", paymentSchema);