var mongoose = require('mongoose');
var transactionSchema = mongoose.Schema({
    _id: mongoose.SchemaTypes.ObjectId,
    paymentID : {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Payments',
        required: 'true'
    },
    orderID: String,
    transaction: {
        id: String,
        entity: String,
        amount: Number,
        currency: String,
        status: String,
        order_id: String,
        invoice_id: String,
        international: Boolean,
        method: String,
        amount_refunded: Number,
        refund_status: String,
        captured: Boolean,
        description: String,
        card_id: String,
        bank: String,
        wallet: String,
        vpa: String,
        email: String,
        contact: String,
        notes: [String],
        fee: Number,
        tax: Number,
        error_code: String,
        error_description: String,
        error_source: String,
        error_step: String,
        error_reason: String,
        acquirer_data: {
            rrn: String,
            upi_transaction_id: String
        },
        created_at: Number,
        upi: {
            vpa: String
        },
        base_amount: Number
    }
});
module.exports = mongoose.model('Transactions', transactionSchema);
