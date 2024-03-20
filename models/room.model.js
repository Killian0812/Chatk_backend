const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema({
    mac: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    manager: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User'
    }
})

module.exports = mongoose.model('Room', roomSchema)