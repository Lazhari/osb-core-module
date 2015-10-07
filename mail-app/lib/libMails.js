/**
 * Created by dark0s on 18/12/14.
 */
var database = require('../../../../database/core/database');
var config = require('../../../../config').config;
var nodemailer = require('nodemailer');
var fs = require('fs');
var ejs = require('ejs');

/**
 * Generate Token User and Send mail
 * @param user
 * @param next
 */
var generateTokenAndSendMail = function(user,next)  {
    require('crypto').randomBytes(48, function(ex, buf)
    {
        var randomString = buf.toString('hex');
        database.Token.remove({user:user._id},function(err)
        {
            if(err) return next(err);
            var token = new database.Token(
                {
                    user:user._id,
                    token:randomString
                });
            token.save(function(err)
            {
                if(err) return next(err);

                var transport = nodemailer.createTransport("SMTP",
                    {
                        //port:1025
                        service:  config.smtpProvider,
                         auth: {
                         user: config.smtpUser,
                         pass: config.smtpPassword
                         }
                    });
                var mailBody;
                var  mailSubject;
                var templateMailActivation = fs.readFileSync(require('../../../../config').appRoot+'/views/Mails/account-activation.ejs', 'utf8');
                var templateMailPasswordReset =  fs.readFileSync(require('../../../../config').appRoot+'/views/Mails/password-reset.ejs', 'utf8');

                if(user.active)
                {
                    mailBody = ejs.render(templateMailPasswordReset,{user:user,token:token.token,hostName:config.hostName});
                    mailSubject = "Changement de mot de passe";
                }
                else
                {
                    mailBody = ejs.render(templateMailActivation,{user:user,token:token.token,hostName:config.hostName});
                    mailSubject = "Activation de votre compte";
                }

                var mailOptions =
                {
                    from:  config.smtpUser,
                    to: user.mail,
                    subject: mailSubject,
                    html : mailBody
                };
                transport.sendMail(mailOptions, function(error, response)
                {
                    if(error)
                    {
                        token.remove(function(err)
                        {
                            if(err)
                            {
                                err.deepErrors = [error];
                                return next(err);
                            }
                            return next(error);
                        });
                    }
                    return next(null,token);
                });

            });

        });

    });
};

var welcomeMails = function(user,content, next) {
    var transport = nodemailer.createTransport("SMTP", {
            port:1025
            /*service:  config.smtpProvider,
             auth:
             {
             user: config.smtpUser,
             pass: config.smtpPassword
             }*/
    });
    var mailBody;
    var  mailSubject;
    var templateMailWelcome = fs.readFileSync(require('../../../../config').appRoot+'/views/Mails/Welcome.ejs', 'utf8');

    mailBody = ejs.render(  templateMailWelcome,{
                            user:user,hostName:config.hostName,
                            content: content
    });
    mailSubject = "Bienvenue lebordeluche.com";

    var mailOptions =
    {
        from:  config.smtpUser,
        to: user.mail,
        subject: mailSubject,
        html : mailBody
    };
    transport.sendMail(mailOptions, function(error, response)
    {
        if(error)
        {
            token.remove(function(err)
            {
                if(err)
                {
                    err.deepErrors = [error];
                    return next(err);
                }
                return next(error);
            });
        }
        return next(null,token);
    });
};

var personalizedMail = function(user,titre,content, next) {
    var transport = nodemailer.createTransport("SMTP", {
        //port:1025
        service:  config.smtpProvider,
         auth: {
             user: config.smtpUser,
             pass: config.smtpPassword
         }
    });
    var mailBody;
    var  mailSubject;
    var templateMailWelcome = fs.readFileSync(require('../../../../config').appRoot+'/views/Mails/personalized-email.ejs', 'utf8');

    mailBody = ejs.render(  templateMailWelcome,{
        titre:titre,
        hostName:config.hostName,
        content: content
    });
    mailSubject = titre;

    var mailOptions =
    {
        from:  config.smtpUser,
        to: user,
        subject: mailSubject,
        html : mailBody
    };
    transport.sendMail(mailOptions, function(error, response)
    {
        if(error) {
            return next(error);
        }
        return next(null);
    });
};

exports.generateTokenAndSendMail = generateTokenAndSendMail;
exports.welcomeMails = welcomeMails;
exports.personalizedMail = personalizedMail;
