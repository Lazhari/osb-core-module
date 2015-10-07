/**
 * Created by dark0s on 08/05/15.
 */
var database = require('../../../../database/core/database');
var check = require('validator').check;
var sanitize = require('validator').sanitize;
exports.Facture = (function(database){
    var getUserInvoices = function(userId, callback) {
        database.Command.find({owner: userId, 'status.value': 'approved'}).sort({'status.dateStatu':-1}).exec(function(err, invoices) {
            return callback(err, invoices);
        })
    };
    var getUserInvoiceByUuid = function(userId, fuuid, callback) {
        database.Command.findOne({owner: userId, 'status.value': 'approved',uuid:fuuid}).populate('items.pack').exec(function(err, invoice) {
            return callback(err, invoice);
        })
    };
    return {
        userInvoices : function(req, res, next) {
            var userId = req.session.user._id;
            getUserInvoices(userId, function(err, invoices) {
                if(err) return res.json({status:"error", data: {message: err.message}});
                if(invoices) {
                    return res.json({status:"success", data: {invoices: invoices}});
                } else {
                    return res.json({status:"success", data: {invoices: []}});
                }
            })
        },
        userInvoiceByUuid: function(req, res, next) {
            var userId = req.session.user._id;
            var fuuid = req.params.fuuid;
            getUserInvoiceByUuid(userId, fuuid, function(err, invoice) {
                if(err) return res.json({status:"error", data: {message: err.message}});
                if(invoice) {
                    return res.json({status:"success", data: {invoice: invoice}});
                } else {
                    return res.json({status:"success", data: {invoice: {}}});
                }
            })
        },
        editFactHeader : function(req, res, next) {
            var factureId = req.body.factureId;
            var header = req.body.header;
            database.Command.findById(factureId, function(err, facture) {
                if(err) {
                    console.log(err);
                    return res.status(500).send({message:"Une erreur est produite lors de modifications de l'en-tête"});
                }
                console.log(facture);
                if(facture) {
                    facture.header = header;
                    facture.save(function(err) {
                        if(err)
                            return res.status(500).send({message:"Une erreur est produite lors de modifications de l'en-tête"});
                        return res.status(200).send(facture);
                    })
                } else {
                    return res.status(500).send({message:"Une erreur est produite lors de modifications de l'en-tête"});
                }
            });
        }

    }
})(database);