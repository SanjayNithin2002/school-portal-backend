var mongoose = require('mongoose');
var feesSchema = mongoose.Schema({
    _id: mongoose.SchemaTypes,
    amount: Number,
    due: {
        type: Date,
        default: null
    },
    standard: {
        type: Number,
        default: null
    },
    type: String
});

