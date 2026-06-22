const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    payment_id: { type: String, unique: true, sparse: true },
    order_id: { type: String, unique: true, required: true },
    donor_name: { type: String, default: 'Anonymous' },
    donor_email: { type: String },
    donor_message: { type: String },
    amount_usd: { type: Number, required: true, min: 1, max: 100 },
    pay_currency: { type: String, default: 'usdttrc20' },
    pay_amount: { type: Number },
    actually_paid: { type: Number },
    status: {
        type: String,
        enum: ['waiting', 'confirming', 'confirmed', 'sending', 'partially_paid', 'finished', 'failed', 'refunded', 'expired'],
        default: 'waiting'
    },
    pay_address: { type: String },
    invoice_url: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    paid_at: { type: Date }
}, { timestamps: true });

donationSchema.index({ status: 1 });
donationSchema.index({ created_at: -1 });
donationSchema.index({ payment_id: 1 });

module.exports = mongoose.model('Donation', donationSchema);
