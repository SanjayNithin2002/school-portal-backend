var mongoose = require('mongoose');
var feesSchema = mongoose.Schema({
    _id: mongoose.SchemaTypes.ObjectId,
    amount: Number,
    due: {
        type: Date,
        default: null
    },
    description: String,
    standard: Number
});

module.exports = mongoose.model('Fees', feesSchema);
