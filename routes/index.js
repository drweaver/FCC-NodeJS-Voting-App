// Auth via Node/Express guide https://hnryjms.github.io/2014/04/authentication/
// Passport.js http://passportjs.org/docs

var express = require('express');
var passport = require('passport');
var Account = require('../models/account');
var Poll = require('../models/poll');
var mongoose = require('mongoose');
var router = express.Router();
var _ = require('underscore');

router.get('/register', function(req, res) {
    res.render('register', { });
});

router.get('/createpoll', function(req, res) {
    res.render('newpoll', { user: req.user });
});

router.post('/createpoll/upload', function(req, res) {
    console.log(req.body);
    var temp_item_array = req.body.items.split(',');
    for ( var x = 0 ; x < temp_item_array.length ; x++ ) {
      temp_item_array[x] = { "item" : temp_item_array[x].trim() , "votes" : 0 }
    }
    console.log(temp_item_array)

    var newPoll = new Poll({
      // req.user contains single-quotes in its JSON which causes formatting issues
      owner: req.user._id,
      name: req.body.name,
      items: temp_item_array
    })
    // https://scalegrid.io/blog/getting-started-with-mongodb-and-mongoose/
    // https://alexanderzeitler.com/articles/mongoose-referencing-schema-in-properties-and-arrays/
    newPoll.save(function(err, data){
      if (err)
        console.log(err);
      else {
        console.log(data, null, 4);
        res.redirect('/');
      }

    })
});

router.get('/poll/:id', function(req, res){
  var id = req.params.id;
  Poll.find({_id : id}, function (err, data) {
      // console.log("POLL:" , JSON.stringify(data, null, 4))
      res.render('chart', { user : req.user, docs : data[0] })
  });
})

router.get('/aggregatepolls/', function(req, res){
  Poll.find({  }, function(err, data){
      // console.log("POLL:" , JSON.stringify(data, null, 4))
      res.render('aggchart', { user : req.user, docs : data })
  })
})

router.get('/poll/:id/remove', function(req, res){
  var id = req.params.id;
  Poll.remove({_id : id}, function (err, data) {
    if (err)
      console.log(err);
    else
      req.flash('info', 'Poll removed!')
  });
  res.redirect('/');
})

router.get('/poll/:id/reset', function(req, res){
  var id = req.params.id;
  console.log("reset:" , id);
  Poll.findOne({_id : id}, function (err, data) {
    console.log(data);
    
    for( var i=0; i<data.items.length; i++ ) {
      Poll.update(
          { "_id": id, "items._id": data.items[i]._id },
          {
              "$set": {
                  "items.$.votes": 0
              }
          },
          function(err, errdata) {
            if (err)
              req.flash('info', 'Error: ' + err)
            else
              console.log(errdata)
              req.flash('info', 'Votes reset');
          }
      );
    }
    res.redirect('/poll/' + id);
    
  });
})

router.get('/resetall', function(req, res){
  console.log("resetall");
  Poll.find({}, function (err, data) {
    //console.log(data);
    _.each(data, poll => {
      //console.log(poll);
      _.each(poll.items, item => {
        //console.log(item);
        Poll.update(
          { "_id": poll._id, "items._id": item._id },
          { "$set": { "items.$.votes": 0 } },
          err => {
            if( err ) 
              req.flash('info', 'Error: '+err);
            else 
              console.log("reset successful for " + item._id);
          });
      });
    });
    
  });
  res.redirect('/');
});

router.post('/poll/:id/newitem', function(req, res){
  var id = req.params.id;
  var item = req.body.item;
  console.log("newitem:" , item);
  Poll.find({_id : id}, function (err, data) {
      Poll.findOneAndUpdate(
          { "_id": id },
          {
              "$push": {
                  "items": { 'item' : item , votes : 0 }
              }
          },
          { update: true },
          function(err, data) {
            if (err)
              req.flash('info', 'Error: ' + err)
            else
              console.log(data)
          }
      );
      res.redirect('/poll/' + id);
  });
})

router.post('/poll/:id/newvote', function(req, res){
  console.log("vote:" , req.body);
  var id = req.params.id;
  var voteid = req.body.voteid;
  console.log("voteid:" , voteid);
  Poll.findOneAndUpdate(
      { "_id": id, "items._id": voteid },
      {
          "$inc": {
              "items.$.votes": 1 // http://stackoverflow.com/questions/26156687/mongoose-find-update-subdocument
          }
      },
      { update: true },
      function(err, data) {
        if (err)
          req.flash('info', 'Error: ' + err)
        else
          req.flash('info', 'Your voting has been saved!')
      }
  );
  res.redirect('/poll/' + id);
})


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

// catch all!
router.get('*', function (req, res) {

    // var db = req.app.get('db') // http://stackoverflow.com/questions/20712712/how-to-pass-variable-from-app-js-to-routes-index-js
    Poll.find({}, function (err, data) {
        //console.log(JSON.stringify(data, null, 4))
        res.render('index', { user : req.user, docs : data, error: req.flash('info') });
    });
});


module.exports = router;
