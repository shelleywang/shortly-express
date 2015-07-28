var db = require('../config');
var Click = require('./click');
var crypto = require('crypto');
var User = require('./user');

var Link = db.Model.extend({
  tableName: 'urls',
  hasTimestamps: true,
  defaults: {
    visits: 0
  },
  // users: function() {
  //   return this.belongsToMany(User);
  // },
  clicks: function() {
    return this.hasMany(Click);
  },
  initialize: function(){
    // this.clicks();
    // this.users();
    this.on('creating', function(model, attrs, options){
      var shasum = crypto.createHash('sha1');
      shasum.update(model.get('url'));
      model.set('code', shasum.digest('hex').slice(0, 5));
    });
  }
});

module.exports = Link;
