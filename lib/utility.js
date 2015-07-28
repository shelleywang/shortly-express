var request = require('request');
var db = require('../app/config');
var cookieParser = require('cookie-parser');
var Session = require('../app/models/session');
var bcrypt = require('bcrypt-nodejs');

exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/

exports.loginCheck = function (req, res, next) {
  exports.validateSession(req, function(isValid) {
    if (isValid) {
      next();
    } else {
      if (req.url === '/login' || req.url === '/signup' || req.url === '/favicon.ico') next();
      else res.set('location', '/login').status(302).end();
    }
  });
};

exports.validateSession = function (req, callback) {
  var sessionID = req.cookies.SessionID;
  if (sessionID) {
    new Session({ id: sessionID }).fetch().then(function (session) {
      var now = Date.now();
      if (session && session.attributes.expires > now) {
        session.set('expires', now + 24 * 60 * 60 * 1000);
        callback(true);
      } else {
        callback(false);
      }
    });
  } else {
    callback(false);
  }
};

exports.createOrRenewSession = function (req, res, callback) {
  var sessionID = req.cookies.SessionID;
  var now = Date.now();
  if (sessionID) {
    new Session({ id: sessionID }).fetch().then(function (session) {
      session.set('expires', now + 24 * 60 * 60 * 1000);
      callback();
    });
  }
  else {
    var session = new Session({
      expires: now+ 24 * 60 * 60 * 1000
    });

    session.save().then(function(newSession) {
      res.set('Set-Cookie', 'SessionID='+newSession.id);
      callback();
    });
  }
};

exports.destroySession = function (res) {
  res.clearCookie('SessionID');
  res.set('location', '/login').status(302).end();
};

exports.hashPassword = function (password, salt, callback) {
  bcrypt.hash(password, salt, null, callback);
};








