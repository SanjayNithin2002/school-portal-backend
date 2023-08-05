var mongoose = require('mongoose');
var personalMessagesSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    postedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Teachers", 
        required: true 
    },
    student: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Students"
    }],
    message: { 
        type: String, 
        required: true 
    },
    postedOn: { 
        type: Date, 
        required: true
    }
});

module.exports = mongoose.model('PersonalMessages', personalMessagesSchema);

