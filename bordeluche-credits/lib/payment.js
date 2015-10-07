/**
 * Created by dark0s on 08/05/15.
 */
var database = require('../../../../database/core/database');
var pack = require('./pack');
//var uuid = require('node-uuid');
var paypal = require('paypal-rest-sdk');
var config = require('../../../../config').config;
var moment = require('moment');

paypal.configure(config.paypalApi);

exports.Payment = (function () {
    return {
        cartPayment: function (req, res, next) {
            var cuuid = req.query.cuuid;
            var userId = req.session.user._id;
            pack.getCommandByUuidForPayment(cuuid, userId, function (err, command) {
                if (err) return res.json({status: "error", data: {message: err.message}});
                if (command) {
                    var paypalPayment = {
                        "intent": "sale",
                        "payer": {
                            "payment_method": "paypal"
                        },
                        "redirect_urls": {},
                        "transactions": [{
                            "amount": {
                                "currency": "EUR"
                            }
                        }]
                    };
                    paypalPayment.transactions[0].amount.total = command.totalCost;
                    paypalPayment.redirect_urls.return_url = "https://" + config.hostName + "/orderExecute?cuuid=" + command.uuid;
                    paypalPayment.redirect_urls.cancel_url = "https://" + config.hostName + "/pro-app/#/app/credit/indent/" + command.uuid;
                    paypalPayment.transactions[0].description = 'Paiement de pack Credit bordeluche';

                    paypal.payment.create(paypalPayment, {}, function (err, resp) {
                        if (err) {
                            console.log(err);
                            return res.json({status: "error", data: {message: "Payment API call failed"}});
                        }

                        if (resp) {
                            command.paymentId = resp.id;
                            command.save(function (err) {
                                if (err) return res.json({status: "error", data: {message: err.message}});
                                var link = resp.links;
                                for (var i = 0; i < link.length; i++) {
                                    if (link[i].rel === 'approval_url') {
                                        res.redirect(link[i].href);
                                    }
                                }
                            })

                        }
                    });
                } else {
                    return res.json({
                        status: "error",
                        data: {message: "La commande que vous avez choisir pour payer n'existe pas !"}
                    });
                }
            })
        },
        CreditCardPayment: function(req, res, next) {
            var cuuid = req.query.cuuid;
            var userId = req.session.user._id;
            pack.getCommandByUuidForPayment(cuuid, userId, function (err, command) {
                if (err) return res.json({status: "error", data: {message: err.message}});
                if (command) {
                    var payment = {
                        "intent": "sale",
                        "payer": {
                            "payment_method": "credit_card",
                            "funding_instruments": [{
                                "credit_card_token": {}
                            }]
                        },
                        "transactions": [{
                            "amount": {
                                "currency": "EUR"
                            },
                            "description": "Paiement pack le bordeluche."
                        }]
                    };

                    database.User.findById(userId, function(err, user) {
                        if (err || !user) {
                            console.log(err);
                            return res.json({status: "error", data: {message: "Payment API call failed"}});
                        } else {
                            payment.payer.funding_instruments[0].credit_card_token.credit_card_id = user.card;
                            payment.transactions[0].amount.total = command.totalCost;
                            payment.transactions[0].description = 'Paiment Commande';
                            paypal.payment.create(payment, {}, function (err, resp) {
                                if (err) {
                                    console.log(err);
                                    res.redirect("https://" + config.hostName + "/pro-app/#/app/credit/indent/" + command.uuid);
                                }
                                if (resp) {
                                    command.status = {
                                        value: resp.state,
                                        dateStatu: new Date()
                                    };
                                    command.expired = moment().add(60, 'day').toISOString();
                                    command.save(function (err, command) {
                                        if (err) {
                                            // Page Command
                                            res.redirect("https://" + config.hostName + "/pro-app/#/app/credit/indent/" + command.uuid);
                                            //return res.json({status:"error", data: {message: err.message}});
                                        }
                                        if (command) {
                                            // Page Facture
                                            var packCreditInstance = {
                                                expired: command.expired,
                                                numbPoints: command.totalPoints,
                                                command: command._id,
                                                owner: userId
                                            };
                                            packCreditInstance = database.PackCredit(packCreditInstance);
                                            packCreditInstance.save();
                                            res.redirect("https://" + config.hostName + "/pro-app/#/app/invoice/" + command.uuid);
                                            //return res.json({status:"success", data: {command: command}});
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    return res.json({
                        status: "error",
                        data: {message: "La commande que vous avez choisir pour payer n'existe pas !"}
                    });
                }
            })
        },
        orderExecute: function (req, res) {
            var cuuid = req.query.cuuid;
            var userId = req.session.user._id;
            pack.getCommandByUuidForPayment(cuuid, userId, function (err, command) {
                if (err) return res.json({status: "error", data: {message: err.message}});
                if (command) {
                    var payer = {payer_id: req.query.PayerID};
                    paypal.payment.execute(command.paymentId, payer, {}, function (err, resp) {
                        if (err) {
                            console.log(err);
                            return res.json({status: "error", data: {message: "execute payment API failed"}});
                            // Page Erreur de Paiement
                        }
                        if (resp) {
                            //command.status.value = resp.state;
                            command.status = {
                                value: resp.state,
                                dateStatu: new Date()
                            };
                            command.expired = moment().add(60, 'day').toISOString();
                            command.save(function (err, command) {
                                if (err) {
                                    // Page Command
                                    res.redirect("https://" + config.hostName + "/pro-app/#/app/credit/indent/" + command.uuid);
                                    //return res.json({status:"error", data: {message: err.message}});
                                }
                                if (command) {
                                    // Page Facture
                                    var packCreditInstance = {
                                        expired: command.expired,
                                        numbPoints: command.totalPoints,
                                        command: command._id,
                                        owner: userId
                                    };
                                    packCreditInstance = database.PackCredit(packCreditInstance);
                                    packCreditInstance.save();
                                    res.redirect("https://" + config.hostName + "/pro-app/#/app/invoice/" + command.uuid);
                                    //return res.json({status:"success", data: {command: command}});
                                }
                            });
                        }
                    });
                } else {
                    return res.json({
                        status: "error",
                        data: {message: "La commande que vous avez choisir pour payer n'existe pas !"}
                    });
                }
            });
        },
        saveCardUser: function(req, res, next) {
            var userCard = req.body.credit_card;
            var userId = req.session.user._id;
            var card = {type: userCard.type, number: userCard.number, cvv2: userCard.cvv2, expire_month: userCard.expireMonth, expire_year: userCard.expireYear };
            database.User.findById(userId, function(err, user) {
                if(err) return res.status(500).send({message: "Une Erreur est produite lors de sauvegarde de carte"});
                if(user) {
                    paypal.credit_card.create(card, {}, function (err, card) {
                        if(err) {
                            if(err.response.name === "VALIDATION_ERROR") {
                                return res.status(err.response.httpStatusCode || 500).send({message : "Vos coordonnées de cartes de crédit sont invalides !"});
                            } else {
                                return res.status(500).send({message: "Une Erreur est produite lors de sauvegarde de carte"});
                            }
                        }
                        var cardId = (err) ? "" : card.id;
                        user.card = cardId;
                        user.save(function(err, user) {
                            if(err) return res.status(500).send({message: "Une Erreur est produite lors de sauvegarde de carte"});
                            return res.send({message: "Votre carte de crédits est ajouté avec succès!"});
                        });

                    });
                } else {
                    return res.status(404).send({message: "Utilisateur est introuvable!"});
                }
            });
        },
        checkCartUser : function(req, res, next) {
            var userId = req.session.user._id;
            database.User.findById(userId, function(err, user) {
                if(err || !user) return res.status(200).send({card:false});
                if(user && user.card) {
                    return res.status(200).send({card:true});
                } else {
                    return res.status(200).send({card:false});
                }
            })
        }

    }
})();