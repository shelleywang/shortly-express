var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var bcrypt = require('bcrypt-nodejs');
var Bookshelf = require('bookshelf');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));

app.use(util.loginCheck);

app.get('/', 
function(req, res) {
  res.render('index');
});

app.get('/create', 
function(req, res) {
  res.render('index');
});

app.get('/links', 
function(req, res) {

  // db.knex('urls').join('users_urls', 'users_urls.url_id', 'urls.id')
  // db.knex('urls').select("*").from('urls')
  // .on('query', function(data){
  //   console.log(data);
  // })
  // .then(function() {
    Links.reset().fetch().then(function(links) {
      // debugger;
      res.send(200, links.models);
    });
  // });



});

app.get('/favicon.ico', function(req,res) {
  res.status(404).end();
});

app.get('/signup', function (req, res) {
  res.render('signup');
});

app.get('/login', function (req, res) {
  res.render('login');
});

app.get('/logout', function (req, res) {
  util.destroySession(res);
});


app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      util.getUserId(req, function(userid) {
        db.knex('users_urls').insert([{user_id: userid,
                         url_id: found.attributes.id}])
          .into('users_urls')
          .then(function() {
            res.send(200, found.attributes);
          });
      });
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {

          util.getUserId(req, function(userid) {
            db.knex('users_urls').insert([{user_id: userid,
                             url_id: newLink.id}])
              .into('users_urls')
              .then(function() {
                Links.add(newLink);
                res.send(200, newLink);
              });
          });

        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.post('/signup', 
function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({ username: username }).fetch().then(function(found) {
    if (found) {
      res.send(900, 'User Already Exists');
    } else {
      bcrypt.genSalt(null, function(err, salt) {
        util.hashPassword(password, salt, function (err, hash) {
          var user = new User({
            username: username,
            password: hash,
            salt: salt
          });

          user.save().then(function(newUser) {
            Users.add(newUser);
            util.createOrRenewSession(req, res, newUser.id, function() {
              res.set({'location':'/'}).status(302).end();
            });
          });
        });
      });
    }
  });
});


app.post('/login',
function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  new User({ username: username }).fetch().then(function(found) {
    if (found) {
      util.hashPassword(password, found.attributes.salt, function (err, hash) {
        if (found.attributes.password === hash) {
          util.createOrRenewSession(req, res, found.attributes.id, function() {
            res.set({'location':'/'}).status(302).end();
          });
        } else {
          res.set('location', '/login').status(302).end();
        }
      });
    } else {
      res.set('location', '/login').status(302).end();
    }
  });
});


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
