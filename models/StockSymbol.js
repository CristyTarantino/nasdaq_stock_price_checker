// External Dependancies
const mongoose = require('mongoose')

const symbolSchema = new mongoose.Schema({
  name: String,
  ips: [String]
});

module.exports = mongoose.model('Symbols', symbolSchema);