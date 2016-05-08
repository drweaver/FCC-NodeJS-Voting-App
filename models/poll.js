var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Poll = new Schema({
    owner: String,
    name: String,
    items: [{ item: String, votes: Number }]
});

module.exports = mongoose.model('polls', Poll);
