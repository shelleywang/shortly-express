var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Link = require('./link')

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  // links: function() {
  //   return this.belongsToMany(Link);
  // },
  initialize: function () {
    // this.links(); 
  }
});

module.exports = User;