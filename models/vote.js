const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const voteSchema = new Schema( {
    owner: {
        type: String,
        required: true
    },
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }
});

module.exports = mongoose.model('Vote', voteSchema);