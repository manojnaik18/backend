const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    className: { type: String, required: true },
});

module.exports = mongoose.model('Student', studentSchema);
