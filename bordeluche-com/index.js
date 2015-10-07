/**
 * Created by dark0s on 20/05/15.
 */
var async = require('async');
var db = require('../../../database/core/database');

/** Import Libs
 */
exports.Fiche = require('./lib/fiches');
exports.Wine = require('./lib/fiche/wine');
exports.Pro = require('./lib/fiche/pro');
exports.Internaute = require('./lib/internautes');
exports.index = function(req, res, next) {
    async.parallel({
        user: function(callback) {
            db.User.findById(req.session.user._id, function(err, user) {
                return callback(err, user);
            })
        }
    }, function(err, data) {
        if(err) return next(err);
        res.render('./com-app/index.ejs',{
            user: data.user
        });
    })
};