// Auth via Node/Express guide https://hnryjms.github.io/2014/04/authentication/
// Passport.js http://passportjs.org/docs

var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var Poll = require('../models/poll');
var mongoose = require('mongoose');
var router = express.Router();

router.get('/', function (req, res) {

    // var db = req.app.get('db') // http://stackoverflow.com/questions/20712712/how-to-pass-variable-from-app-js-to-routes-index-js
    Poll.find({}, function (err, data) {
        console.log(JSON.stringify(data))
        res.render('index', { user : req.user, docs : data });
    });



});

router.get('/register', function(req, res) {
    res.render('register', { });
});

router.get('/createpoll', function(req, res) {
    res.render('newpoll', { });
});

router.post('/createpoll/upload', function(req, res) {
    console.log(req.body);
    var temp_item_array = req.body.items.split(',');
    for ( var x = 0 ; x < temp_item_array.length ; x++ ) {
      temp_item_array[x] = { "item" : temp_item_array[x].trim() , "votes" : 0 }
    }
    console.log(temp_item_array)

    var newPoll = new Poll({
      owner: req.user,
      name: req.body.name,
      items: temp_item_array
    })

    newPoll.save(function(err, data){
      if (err) console.log(err);
      else console.log('Saved ', data );
    })
});


router.post('/register', function(req, res, next) {
    Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
        if (err) {
          return res.render('register', { error : err.message });
        }

        passport.authenticate('local')(req, res, function () {
            req.session.save(function (err) {
                if (err) {
                    return next(err);
                }
                res.redirect('/');
            });
        });
    });
});


router.get('/login', function(req, res) {
    res.render('login', { user : req.user, error : req.flash('error')});
});

router.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), function(req, res, next) {
    req.session.save(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

router.get('/logout', function(req, res, next) {
    req.logout();
    req.session.save(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

router.get('/ping', function(req, res){
    res.status(200).send("pong!");
});

// http://stackoverflow.com/questions/5794834/how-to-access-a-preexisting-collection-with-mongoose
function findInCollection (collec, query, callback) {
    mongoose.connection.db.collection(collec, function (err, collection) {
    collection.find(query).toArray(callback);
    });
}

module.exports = router;
