/**
 * Created by dark0s on 03/09/15.
 */
var database = require('../../../../database/core/database');
var config = require('../../../../config').config;
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var fs = require('fs');
var ejs = require('ejs');
var sendgrid = require("sendgrid")('medlaz', "J?h@nyY'bG8F={'t10;@/y~i");
var email = new sendgrid.Email();
//var mailLoger = require('../../bordeluche-loger');
var pdf = require('html-pdf');


var CouponMailing = (function(){

    var sendingCoupon  = function(user, email, coupon, sendServiceType, callback) {
        var mailBody;
        var  mailSubject;
        var templateMailWelcome = fs.readFileSync(require('../../../../config').appRoot+'/views/Mails/coupon/mail-marketing.ejs', 'utf8');

        mailBody = ejs.render(  templateMailWelcome,{
            coupon:coupon,
            hostName:config.hostName
        });
        mailSubject = "Réservation Coupon:" + coupon.label;

        if(sendServiceType === "send-grid") {
            var email = new sendgrid.Email({
                to: email,
                from: "contact@lebordeluche.com",
                subject : mailSubject,
                html: mailBody
            });
            sendgrid.send(email, function(err, status) {
                if (err) { return callback(err); }
                //mailLoger.mailLoger(req, user._id, user.login, mailSubject, status.message, 'SendGrid');
                return callback(null)
            });
        } else {
            var mailOptions = {
                from:  config.smtpUser,
                to: email,
                subject: mailSubject,
                html : mailBody
            };
            var transporter = nodemailer.createTransport(smtpTransport({
                host: config.smtpProvider,
                port: 25,
                auth: {
                    user: config.smtpUser,
                    pass: config.smtpPassword
                },
                ignoreTLS: true
            }));

            transporter.sendMail(mailOptions, function(error, info){
                console.log(info);
                return callback(error,info);
            });
        }
    };

    var mailDistributeCouponMarketing  = function(proEmail, emails, coupon, sendServiceType, callback) {
        var mailBody;
        var  mailSubject;
        var templateMailWelcome = fs.readFileSync(require('../../../../config').appRoot+'/views/Mails/coupon/mail-notification-distribution-callcenter.ejs', 'utf8');

        mailBody = ejs.render(  templateMailWelcome,{
            coupon:coupon,
            proEmail: proEmail,
            hostName:config.hostName
        });
        mailSubject = "Réservation Coupon:" + coupon.label;

        if(sendServiceType === "send-grid") {
            var email = new sendgrid.Email({
                to: emails,
                from: "contact@lebordeluche.com",
                subject : mailSubject,
                html: mailBody
            });
            sendgrid.send(email, function(err, status) {
                if (err) { return callback(err); }
                //mailLoger.mailLoger(req, user._id, user.login, mailSubject, status.message, 'SendGrid');
                return callback(null)
            });
        } else {
            var mailOptions = {
                from:  config.smtpUser,
                to: emails,
                subject: mailSubject,
                html : mailBody
            };
            var transporter = nodemailer.createTransport(smtpTransport({
                port: 1025,
                /*host: config.smtpProvider,
                auth: {
                    user: config.smtpUser,
                    pass: config.smtpPassword
                },*/
                ignoreTLS: true
            }));

            transporter.sendMail(mailOptions, function(error, info){
                console.log(info);
                return callback(error,info);
            });
        }
    };

    var sendMailToInternaute = function(emails, coupon, sendServiceType, callback) {
        var mailBody;
        var  mailSubject;
        var templateMailWelcome = fs.readFileSync(require('../../../../config').appRoot+'/views/Mails/coupon/mail-marketing-internaute.ejs', 'utf8');

        mailBody = ejs.render(  templateMailWelcome,{
            coupon:coupon,
            hostName:config.hostName
        });
        mailSubject = "Réservation Coupon:" + coupon.label;
        var options = { format: 'Letter' };
        var templateCoupon = fs.readFileSync(require('../../../../config').appRoot+'/routes/bordeluche_modules/osb-coupon-reservation/tpl/coupon.ejs', 'utf8');

        var couponTemplate = ejs.render(templateCoupon,{
            coupon: coupon,
            endDate: require('moment')(coupon.publishedDate.endDate).format('DD/MM/YYYY'),
            hostName:config.hostName
        });

        if(sendServiceType === "send-grid") {

            pdf.create(couponTemplate, options).toStream(function(err, stream){
                if (err) return callback(err);

                var email = new sendgrid.Email({
                    to: emails,
                    from: "contact@lebordeluche.com",
                    subject : mailSubject,
                    html: mailBody,
                    files: [{
                        filename: coupon.label+'-'+coupon.uniqId+'-lebordeluche.pdf',
                        content: stream
                    }]
                });
                sendgrid.send(email, function(err, status) {
                    if (err) { return callback(err); }
                    //mailLoger.mailLoger(req, user._id, user.login, mailSubject, status.message, 'SendGrid');
                    return callback(null)
                });
            });
        } else {
            var transporter = nodemailer.createTransport(smtpTransport({
                port: 1025,
                /*host: config.smtpProvider,
                auth: {
                    user: config.smtpUser,
                    pass: config.smtpPassword
                },*/
                ignoreTLS: true
            }));

            pdf.create(couponTemplate, options).toStream(function(err, stream){
                if (err) return console.log(err);

                var mailOptions = {
                    from:  config.smtpUser,
                    to: emails,
                    subject: mailSubject,
                    html : mailBody,
                    attachments: [
                        {
                            filename: coupon.label+'-'+coupon.uniqId+'-lebordeluche.pdf',
                            content: stream
                        }
                    ]
                };

                transporter.sendMail(mailOptions, function(error, info){
                    console.log(info);
                    return callback(error,info);
                });
            });
        }
    };
    var mailBackReservation = function(emails, mailInternaute, proEmail, coupon, sendServiceType, callback) {
        var mailBody;
        var  mailSubject;
        var templateMailWelcome = fs.readFileSync(require('../../../../config').appRoot+'/views/Mails/coupon/mail-notification-callcenter.ejs', 'utf8');

        mailBody = ejs.render(  templateMailWelcome,{
            coupon:coupon,
            hostName:config.hostName,
            mailInternaute: mailInternaute,
            proEmail: proEmail
        });
        mailSubject = "Réservation Coupon:" + coupon.label;

        if(sendServiceType === "send-grid") {
            var email = new sendgrid.Email({
                to: emails,
                from: "contact@lebordeluche.com",
                subject : mailSubject,
                html: mailBody
            });
            sendgrid.send(email, function(err, status) {
                if (err) { return callback(err); }
                //mailLoger.mailLoger(req, user._id, user.login, mailSubject, status.message, 'SendGrid');
                return callback(null)
            });
        } else {
            var mailOptions = {
                from:  config.smtpUser,
                to: emails,
                subject: mailSubject,
                html : mailBody
            };
            var transporter = nodemailer.createTransport(smtpTransport({
                port: 1025,
                /*host: config.smtpProvider,
                auth: {
                    user: config.smtpUser,
                    pass: config.smtpPassword
                },*/
                ignoreTLS: true
            }));

            transporter.sendMail(mailOptions, function(error, info){
                console.log(info);
                return callback(error,info);
            });
        }
    };

    var mailNotificationReservationPro = function(pro, coupon, sendServiceType, callback) {
        var mailBody;
        var  mailSubject;
        var templateMailWelcome = fs.readFileSync(require('../../../../config').appRoot+'/views/Mails/coupon/mail-notification-pro-reservation.ejs', 'utf8');

        mailBody = ejs.render(  templateMailWelcome,{
            coupon:coupon,
            hostName:config.hostName,
            pro: pro
        });
        mailSubject = "Réservation Coupon:" + coupon.label;

        if(sendServiceType === "send-grid") {
            var email = new sendgrid.Email({
                to: pro.login,
                from: "contact@lebordeluche.com",
                subject : mailSubject,
                html: mailBody
            });
            sendgrid.send(email, function(err, status) {
                if (err) { return callback(err); }
                //mailLoger.mailLoger(req, user._id, user.login, mailSubject, status.message, 'SendGrid');
                return callback(null)
            });
        } else {
            var mailOptions = {
                from:  config.smtpUser,
                to: pro.login,
                subject: mailSubject,
                html : mailBody
            };
            var transporter = nodemailer.createTransport(smtpTransport({
                port: 1025,
                /*host: config.smtpProvider,
                 auth: {
                 user: config.smtpUser,
                 pass: config.smtpPassword
                 },*/
                ignoreTLS: true
            }));

            transporter.sendMail(mailOptions, function(error, info){
                console.log(info);
                return callback(error,info);
            });
        }
    };

    var mailDistributeCouponPro = function(pro, coupon, sendServiceType, callback) {
        var mailBody;
        var  mailSubject;
        var templateMailWelcome = fs.readFileSync(require('../../../../config').appRoot+'/views/Mails/coupon/mail-marketing-distribution-coupon-pro.ejs', 'utf8');

        mailBody = ejs.render(  templateMailWelcome,{
            coupon:coupon,
            pro: pro,
            hostName:config.hostName
        });
        mailSubject = "Distribution Coupon:" + coupon.label;

        mailSubject = "Réservation Coupon:" + coupon.label;
        var options = { format: 'Letter' };
        var templateCoupon = fs.readFileSync(require('../../../../config').appRoot+'/routes/bordeluche_modules/osb-coupon-reservation/tpl/coupon.ejs', 'utf8');

        var couponTemplate = ejs.render(templateCoupon,{
            coupon: coupon,
            endDate: require('moment')(coupon.publishedDate.endDate).format('DD/MM/YYYY'),
            hostName:config.hostName
        });

        if(sendServiceType === "send-grid") {
            var email = new sendgrid.Email({
                to: pro.login,
                from: "contact@lebordeluche.com",
                subject : mailSubject,
                html: mailBody
            });

            pdf.create(couponTemplate, options).toStream(function(err, stream){
                if (err) return callback(err);

                email.addFile({
                    filename: coupon.label+'-'+coupon.uniqId+'-lebordeluche.pdf',
                    content: stream
                });
                sendgrid.send(email, function(err, status) {
                    if (err) { return callback(err); }
                    //mailLoger.mailLoger(req, user._id, user.login, mailSubject, status.message, 'SendGrid');
                    return callback(null)
                });
            });
        } else {
            var transporter = nodemailer.createTransport(smtpTransport({
                port: 1025,
                /*host: config.smtpProvider,
                 auth: {
                 user: config.smtpUser,
                 pass: config.smtpPassword
                 },*/
                ignoreTLS: true
            }));

            pdf.create(couponTemplate, options).toStream(function(err, stream){
                if (err) return console.log(err);

                var mailOptions = {
                    from:  config.smtpUser,
                    to: pro.login,
                    subject: mailSubject,
                    html : mailBody,
                    attachments: [
                        {
                            filename: coupon.label+'-'+coupon.uniqId+'-lebordeluche.pdf',
                            content: stream
                        }
                    ]
                };

                transporter.sendMail(mailOptions, function(error, info){
                    console.log(info);
                    return callback(error,info);
                });
            });
        }
    };
    return {
        sendcoupon: sendingCoupon,
        sendCouponToInternaut : sendMailToInternaute,
        mailBackReservation: mailBackReservation,
        mailDistributeCouponPro: mailDistributeCouponPro,
        mailDistributeCouponMarketing: mailDistributeCouponMarketing,
        mailNotificationReservationPro : mailNotificationReservationPro
    }
})();

module.exports = CouponMailing;