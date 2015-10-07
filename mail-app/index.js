/**
 * Created by dark0s on 17/12/14.
 */
var database = require('../../../database/core/database');
var async = require('async');
var csv = require('csv');
var check = require('validator').check ;
var $user = require('../../Common/users');
var libMail = require('./lib/libMails');


exports.index = function(req,res,next) {
    return res.render('MailApp/index',{
        globalVars: req.globalVars
    });
};

exports.personalizedEmail = function(req,res,next) {
    return res.render('MailApp/personalizedEmail',{
        globalVars: req.globalVars
    });
};

exports.archivedEmail = function(req,res,next) {
    async.parallel({
        mails : function getArchivedMails(callback) {
            database.ArchiveMail.find().sort({sendingDate:-1}).exec(function(err,mails) {
                return callback(err,mails);
            });
        }
    },function(err,result) {
        return res.render('MailApp/archivedMail',{
            globalVars: req.globalVars,
            mails : result.mails
        });
    });
};

exports.getUser = function(req, res, next) {
    var role = parseInt(req.query.role);
    if (isNaN(role))
        role = 0;
    if (!$user.roleExists(role))
        role = 0;
    database.User.find({role:role}).select('login nom prenom lastConnexion statu').exec(function(err,users) {
        if(err) {
            next(err);
        }
        if(users) {
            return res.json({'aaData':users});
        } else {
            return res.json({'aaData':[]});
        }
    });
};

var ObjectId = require('mongoose').Types.ObjectId;
exports.sendMailBulkActivationCount = function(req, res, next) {
    var users = req.body.users;
    if(users) {
        async.each(users,function(user_id,callback){
            database.User.findOne({_id:ObjectId(user_id)},function(err,user) {
                if(err) {
                    callback(err);
                }
                if(user) {
                    libMail.generateTokenAndSendMail(user, function (err, token) {
                        if (err) return callback(err);

                        callback(null);
                    });
                }
            });
        }, function(err){
            if(err)
                return res.json({ok:false, msg:"Une erreur est survenue"});
            else
                return res.json({ok:true, msg:"les emails sont envoyés avec succés"});
        });
    }
};

exports.sendPersonlizedEmail = function(req, res, next) {
    var mails = req.body.mails;
    var titre = req.body.titre;
    var contenu = req.body.contenu;
    if(mails && mails.length>0) {
        async.each(mails,function(mail,callback){
            libMail.personalizedMail(mail,titre,contenu, function (err, token) {
                if (err) return callback(err);

                callback(null);
            });
        }, function(err){
            if(err)
                return res.json({ok:false, msg:"Une erreur est survenue"});
            else{

                var mailArchive = {
                    mail : mails,
                    mailContent : contenu,
                    mailObject : titre,
                    sendingDate : new Date()
                };
                mailArchive  = database.ArchiveMail(mailArchive);
                mailArchive.save(function(err){
                    if(err) return next(err);
                });
                return res.json({ok:true, msg:"les emails sont envoyés avec succés"});
            }
        });
    } else {
        return res.json({ok:false, msg:"Une erreur est survenue"});
    }
};