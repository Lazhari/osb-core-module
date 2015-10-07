/**
 * Created by dark0s on 30/03/15.
 */
var database = require('../../../database/core/database');
var userAgentParser = require('user-agent-parser');
var geoip = require('geoip-lite');
/**
 * Save Log Email
 * @param {ObjectId} senderUserId - Sender Id
 * @param {ObjectId} receiverUserId - receiver Id
 * @param {String} mail - user mail
 * @param {String} subljet
 * @param {String} status
 * @param {String} service
 * @param {Request} req
 */
exports.mailLoger = function (req, receiverUserId, mail, subljet, status, service) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var mailLogObject = {
        status: status,
        sender: req.session.user._id,
        receiver: receiverUserId,
        ip: ip,
        email: mail,
        subject: subljet,
        service: service
    };
    var mailLogInstance = database.MailLog(mailLogObject);
    mailLogInstance.save();
};

exports.visitorLoger = function(req){
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var visitorLogObject = {
        ip: ip,
        userAgent: userAgentParser(req.headers['user-agent']),
        geo : geoip.lookup(ip)? geoip.lookup(ip):{},
        originalUrl: req.originalUrl
    };
    var visitorLogInstance = database.Visitor(visitorLogObject);
    visitorLogInstance.save();
};