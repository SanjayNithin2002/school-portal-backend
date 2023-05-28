var mongoose = require('mongoose');
var personalMessagesSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    teacher: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Teachers", 
        required: true 
    },
    student: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Students", 
        required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    date: { 
        type: Date, 
        required: true
    }
});

module.exports = mongoose.model('PersonalMessages', personalMessagesSchema);

