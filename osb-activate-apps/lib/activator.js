/**
 * Created by dark0s on 06/07/15.
 */

var database = require('../../../../database/core/database');
var moment = require('moment');
var check = require('validator').check,sanitize = require('validator').sanitize;
var helper =require("../../../../helper");
var CreditManager = require("../../bordeluche-credits/lib/credit-manger").CreditManager;
var fs = require('fs');
var uuid = require('node-uuid');
var Activator = (function() {
    var _createAppUserInstance = function(userId, duration, appCode) {
        var appUserInstance = database.UserApp({
            owner: userId,
            created : new Date(),
            token: uuid.v4(),
            expired: moment().add(duration, 'day').toISOString(),
            activated: new Date(),
            applicationCode: appCode,
            duration: duration
        });
        return appUserInstance;
    };

    return {
        activateApp: function(req, res) {
            var userId = req.session.user._id;
            var points = req.body.points;
            var app = req.body.app;
            database.User.findById(userId).exec(function(err, user) {
                if(err) return res.json({status:"error", data:{message: err.message}});
                if(user) {
                    CreditManager.consumePackCreditsUser(userId, points, function(err, restpoints) {
                        if(err) res.status(200).send({status:"Failed", data:{message:err.message}});

                        else {
                            var appInstance = _createAppUserInstance(userId, app.duration, app.appCode);
                            appInstance.save(function(err, app) {
                                if(err) res.status(403).send({status:"Failed", data:{message:"Erreur est produite lors de reservation de l'application "+app.appCode}});
                                return res.json({status:"success", data:{points: restpoints, tokenApp: app.token}});
                            });
                        }
                    })

                } else {
                    res.status(403).send({status:"Failed", data:{message:"Erreur est produite lors de reservation de l'application "+app.appCode}});
                }
            })
        },

        checkAppToken: function(req, res) {
            var userId = req.session.user._id;
            var appCode = req.body.appCode;
            database.UserApp.findOne({owner: userId, 'expired':{$gt: new Date()},applicationCode: appCode}, function(err, app) {
                if(err) res.status(200).send({status:"error", data:{message: "Erreur est produite lors de vérification de token Application"}});
                if(app) {
                    if(app) {
                        res.status(200).send({status:"success", data:{token: app.token}});
                    }
                } else {
                    res.status(200).send({status:"failed", data:{message: "Erreur est produite lors de vérification de token Application"}});
                }
            })
        }
    }
})();

module.exports = Activator;