const mongoose = require('mongoose')

const entrySchema = new mongoose.Schema(
    {
        mac: {
            type: String,
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        image: {
            type: String
        }
    },
    {
        timestamps: true
    });

module.exports = mongoose.model('Entry', entrySchema)