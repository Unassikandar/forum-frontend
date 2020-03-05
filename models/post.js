const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const postSchema = new Schema( {
    disId: {
        type: Schema.Types.ObjectId,
        ref: 'Discussion'
    },
    parId: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Post', postSchema);