/**
 * Created by dak0s on 07/07/15.
 */

var database = require('../../../../../database/core/database');
var check = require('validator').check;
var sanitize = require('validator').sanitize;
var async = require('async');
var UserCatalogue = (function() {
    var _saveCatalogue = function(catalogueObject, userId, callback) {
        if(catalogueObject && userId) {
            try {
                check(catalogueObject.title,"Le titre de catalogue est requis").notEmpty();
                check(catalogueObject.affiches,"Le catalogue doit au moins contient un restaurant").notEmpty;
            }
            catch(err) {
                return callback(err);
            }
            // Securing data
            catalogueObject.title = sanitize(catalogueObject.title).xss();
            catalogueObject.comment = sanitize(catalogueObject.comment).xss();
            var catalogue = database.UserCatalogue(catalogueObject);
            catalogue.owner = userId;
            catalogue.save(function(err, catalogue) {
                return callback(err, catalogue);
            })
        } else {
            return callback(new Error('Vous devez spécifier un catalogue'));
        }
    };

    var _getCatalogueById = function(id, callback) {
        if(id) {
            database.UserCatalogue.findById(id).exec(function(err, catalogue) {
                return callback(err, catalogue);
            })
        } else {
            return callback(new Error("Vous devez "))
        }
    };
    var _buildCatalogue = function(catalogueObject, callback) {
        if(catalogueObject) {
            if(catalogueObject.affiches && catalogueObject.affiches.length) {
                async.map(catalogueObject.affiches, function(affiche,callback) {
                    database.Restaurant.findById(affiche.restaurant).populate('critique Specialites.value Plats.value InfosTechniques.value').exec(function(err, restaurant) {
                        if(err) return callback(err);
                        if(restaurant) {
                            var restaurant0bj = {
                                restaurant:restaurant,
                                note: affiche.note
                            };
                            return callback(null, restaurant0bj);
                        }
                    })
                }, function(err, affiches) {
                    if(err) return callback(err);
                    var catalogue = {
                        panier : catalogueObject.panier,
                        affiches: affiches,
                        title: catalogueObject.title,
                        comment: catalogueObject.comment,
                        owner: catalogueObject.owner,
                        created: catalogueObject.created,
                    };
                    return callback(null, catalogue);
                })
            }
        } else {
            return callback(new Error('You should get a catalogue Object'));
        }
    };

    var _getUserCatalogues = function(userId, callback) {
        database.UserCatalogue.find({owner: userId}, function(err, catalogues) {
            return callback(err, catalogues);
        })
    };

    return {
        createNewCatalogue : function(req, res, next) {
            var cataloque = req.body.catalogue;
            var userId = req.session.user._id;
            _saveCatalogue(cataloque, userId, function(err, catalogue) {
                if(err) return res.status(200).send({status:"error", message: err.message});
                if(catalogue) {
                    return res.status(200).send({status:"success", catalogue: catalogue})
                }
            })
        },
        getCatalogueById: function(req, res, next) {
            var id = req.query.id;
            _getCatalogueById(id, function(err, catalogue) {
                if(err) return res.status(200).send({status:"error", message: "Une erreur est produite lors du chargement de catalogue"});
                if(catalogue) {
                    _buildCatalogue(catalogue, function(err, catalogue) {
                        if(err) return res.status(500).send({status:"error", message:err.message});
                        return res.status(200).send({status:"success", results: catalogue});
                    })
                } else {
                    return res.status(404).send({status: "error", message:"Aucun catalogue avec ce ID dans notre base de données"})
                }
            })
        },
        getUserCatalogues: function(req, res) {
            var userId = req.session.user._id;
            _getUserCatalogues(userId, function (err, catalogues) {
                if(err) return res.status(200).send({status: "error", results: err.message});

                if(catalogues) {
                    return res.status(200).send({status: "success", results: catalogues});
                } else {
                    return res.status(404).send({status:"error", message:"Aucune catalogue trouvée"});
                }
            })
        }
    }
})();

module.exports = UserCatalogue;