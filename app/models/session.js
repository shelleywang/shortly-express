var db = require('../config');
var bcrypt = require('bcrypt-nodejs');

var Session = db.Model.extend({
  tableName: 'sessions',
  hasTimestamps: false,
  initialize: function () {
    
  }
});

module.exports = Session;