/**
 * Created by dark0s on 20/05/15.
 */
var database = require('../../../../database/core/database');
var async = require('async');
var Fiche = (function(database, async){
    var getUserFiches = function(userId, callback) {
        var select= 'nom telephone adresse statu statutValidation';
        database.Restaurant.find({operateur:userId}).select(select).exec(function(err, restaurants) {
            return callback(err, restaurants);
        })
    };
    var getFicheById = function(ficheId, callback) {
        database.Restaurant.findById(ficheId).exec(function(err, fiche) {
            return callback(err, fiche);
        })
    };
    var getGeneralInfosFicheById = function(ficheId, callback) {
        var select= 'nom telephone adresse statu statutValidation pro';
        database.Restaurant.findById(ficheId).populate('pro').select(select).exec(function(err, fiche) {
            return callback(err, fiche);
        })
    };
    var getFicheItemsById = function(ficheId, criteria, callback) {
        database.Restaurant.findById(ficheId).populate('pro').select(criteria).exec(function(err, fiche) {
            return callback(err, fiche);
        })
    };
    var autoCompleteCity = function(term, callback) {
        var containsRegex =  new RegExp("^"+RegExp.escape(term).replace('i','[i|î]').replace('e','[e|é|ê|è]')+"+", 'gi');
        database.Ville.find({nom: containsRegex}).select('nom').limit(100).exec(function(err, cities) {
            return callback(err, cities);
        })
    };
    return {
        getUserFiches: function(req, res, next) {
            var operatorId = req.session.user._id;
            getUserFiches(operatorId, function(err, restaurants) {
                if(err) return res.json({status: "error", data:{message: err.message}});
                if(restaurants) {
                    return res.json({aaData: restaurants})
                }
            })
        },

        getFicheById: function(req, res, next) {
            var ficheId = req.params.id;
            getFicheById(ficheId, function(err, fiche) {
                if(err) return res.json({status: "error", data:{message: err.message}});
                if(fiche) {
                    return res.json({status: "success", data:{fiche: fiche}});
                }
            })
        },

        getFicheItemsById: function(req, res, next) {
            var ficheId = req.params.id;
            var criteria = req.query.criteria? req.query.criteria:'';
            getFicheItemsById(ficheId,criteria, function(err, fiche) {
                if(err) return res.json({status: "error", data:{message: err.message}});
                if(fiche) {
                    return res.json({status: "success", data:{fiche: fiche}});
                }
            })
        },

        getGeneralInfosFicheById: function(req, res, next) {
            var ficheId = req.params.id;
            getGeneralInfosFicheById(ficheId, function(err, fiche) {
                if(err) return res.json({status: "error", data:{message: err.message}});
                if(fiche) {
                    return res.json({status: "success", data:{fiche: fiche}});
                }
            })
        },
        autoCompleteCity: function(req, res, next) {
            var term = req.query.term;
            if(term) {
                autoCompleteCity(term, function(err, cities) {
                    if(err) return res.json({status: "error", data:{message: err.message}});
                    if(cities) {
                        return res.json({status: "success", cities: cities});
                    }
                })
            } else {
                return res.json({status: "error", data:{message: 'Vous devez spécifier term'}});
            }
        },
        saveBlockAddress : function(req,res,next) {
            var afficheId = req.body.afficheId;
            database.Restaurant.findById(afficheId,function(err,restaurant) {
                if(err) {
                    console.error(err);
                    return res.json({ok:false,msg:"Désolé,une erreur est survenue"});
                }
                if(!restaurant) {
                    return res.json({ok:false,msg:"Désolé,une erreur est survenue : Restaurant introuvable"});
                }

                var nom = req.body.restaurant.nom;
                var mail = req.body.restaurant.mail;
                var telephone = req.body.restaurant.telephone;
                var siteWeb = req.body.restaurant.siteWeb;

                var adresse = {};
                adresse.numRue = req.body.restaurant.adresse.numRue;
                adresse.body = req.body.restaurant.adresse.body;
                adresse.cp = req.body.restaurant.adresse.cp;
                adresse.ville = req.body.restaurant.adresse.ville;
                adresse.pays = req.body.restaurant.adresse.pays;

                var lat = req.body.restaurant.adresse.lat ? parseFloat(req.body.restaurant.adresse.lat ) : NaN;
                var lng = req.body.restaurant.adresse.lng ?parseFloat(req.body.restaurant.adresse.lng ) : NaN;
                if(!isNaN(lat)&&!isNaN(lng)) {

                    adresse.loc = {
                        type: "Point",
                        coordinates:[lng,lat]
                    };
                }
                restaurant.nom = nom;
                restaurant.mail = mail;
                restaurant.telephone = telephone;
                restaurant.siteWeb = siteWeb;
                restaurant.adresse = adresse;
                restaurant.save(function(err) {
                    if(err) {
                        console.error(err);
                        return res.json({ok:false,msg:"Désolé,une erreur est survenue"});
                    }
                    return res.json({ok:true,restaurant:restaurant});
                })

            });
        },
        saveMotPatron: function(req, res) {
            var afficheId = req.body.afficheId;
            var motPatron = req.body.motPatron;
            database.Restaurant.findById(afficheId,function(err,affiche) {
                if(err) {
                    console.error(err);
                    return res.json({ok:false,msg:"Désolé, une erreur est survenue"});
                }
                affiche.description = motPatron;
                affiche.dateModificationDescription = new Date();
                affiche.save(function(err) {
                    if(err) {
                        console.error(err);
                        return res.json({status:"error", data:{message:"Désolé, une erreur est survenue"}});
                    }
                    return res.json({status:"success", data:{description :affiche.description}});
                })
            });
        },
        updateStatu: function(req, res) {
            var afficheId = req.body.ficheId;
            var statu = req.body.statu;
            database.Restaurant.findById(afficheId,function(err,affiche) {
                if(err) {
                    console.error(err);
                    return res.json({status:"error", data:{message:"Désolé, une erreur est survenue"}});
                }
                affiche.statu = statu;
                affiche.save(function(err) {
                    if(err) {
                        console.error(err);
                        return res.json({status:"error", data:{message:"Désolé, une erreur est survenue"}});
                    }
                    return res.json({status:"success", data:{statu :affiche.statu}});
                })
            });
        },
        saveCriterion : function(req, res, next) {
            var afficheId = req.body.afficheId;
            database.Restaurant.findById(afficheId,function(err,restaurant) {
                if(err) {
                    return res.json({status:"error",data: {message:"Désolé,une erreur est survenue"}});
                }
                if(!restaurant) {
                    return res.json({status:"error",data: {message:"Désolé,une erreur est survenue : Restaurant introuvable"}});
                }
                var panier = req.body.panier;
                var update= {};
                if(panier && panier.criteres) {
                    async.each(panier.criteres,function(critere,finishedCritere) {
                        switch(critere.contentType) {
                            case "Attribut": {
                                database.Attribut.findById(critere.attribut).populate("root").exec(function(err, attribut) {
                                    if(err)
                                        return finishedCritere(err);
                                    if(!attribut) {
                                        console.log("Erreur : Attribut introuvable",critere.attribut);
                                        return finishedCritere();
                                    } else {
                                        if(attribut.root) {
                                            if(!update[attribut.root.label])
                                                update[attribut.root.label]  = [];

                                            update[attribut.root.label].push({
                                                value: attribut._id
                                                ,label: attribut.label
                                            });
                                            console.log(update);
                                        }
                                        return finishedCritere();
                                    }

                                });
                            } break;
                            case "lieu":
                            case "area":{
                                console.log("Rien à faire pour le type :",critere.contentType)
                                return finishedCritere();
                            } break;
                            case "cuisine": {
                                if(!update.cuisines)
                                    update.cuisines = [];
                                if(critere.cuisine) {
                                    database.CuisineDuMonde.findById(critere.cuisine,function(err,cuisine) {
                                        if(err)
                                            return finishedCritere(err);
                                        if(!cuisine) {
                                            console.error("Cuisine introuvable :",critere.cuisine);
                                            return finishedCritere();
                                        }
                                        update.cuisines.push({
                                                value: cuisine._id
                                                ,label: cuisine.label
                                        });
                                        return finishedCritere();
                                    });
                                }
                                else {
                                    console.error("Pas de cuisine envoyée pour le critère cuisine");
                                    return finishedCritere();
                                }

                            } break;
                            default : {
                                console.log("Type de critere non reconnu : ",critere.contentType);
                                finishedCritere();
                            }
                        }
                    },function(err) {
                        if(err) {
                            console.error(err);
                            return res.json({ok:false,msg:"Désolé,une erreur est survenue"});
                        }
                        console.log("Update : ",update);

                        if(update.InfosTechniques) {
                            restaurant.InfosTechniquesText ="";
                            for(var j in update.InfosTechniques){
                                restaurant.InfosTechniquesText += "#"+update.InfosTechniques[j].label+" ";
                            }
                        } else{
                            restaurant.InfosTechniquesText ="";
                        }

                        for(var i in update) {
                            restaurant[i] = update[i];
                        }
                        restaurant.save(function(err) {
                            if(err) {
                                console.error(err);
                                return res.json({ok:false,msg:"Désolé,une erreur est survenue"});
                            }
                            // TODO : edit response json
                            return res.json({ok:true,Rrestaurant:restaurant});
                        })
                    });
                }
                else {
                    return res.json({status:"error", data: {message:'Aucun critères envoyé , suppression des attributs de la fiche'}});
                    restaurant.Specialites = [];
                    restaurant.Plats = [];
                    restaurant.prix = [];
                    restaurant.cuisines = [];
                    restaurant.save(function(err) {
                        if(err) {
                            console.error(err);
                            return res.json({status:"error", data: {message:'Désolé,une erreur est survenue'}});
                        }
                        return res.json({ok:true});
                    })
                }
            });
        },
        saveMenu: function(req, res, next) {
            var afficheId = req.body.afficheId;
            var menu = req.body.menu;

            database.Restaurant.findById(afficheId).exec(function(err,restaurant) {
                if(err) return res.json({status:"error", data:{message:"message"}});

                if(restaurant) {
                    if(req.body.stat =="new") {
                        if(restaurant.menus && restaurant.menus.length)
                            restaurant.menus.push(menu);
                        else {
                            restaurant.menus=[];
                            restaurant.menus.push(menu);
                        }
                    } else {
                        menu.entrees = menu.entrees.filter(function(item) {return item!="";});
                        menu.plats = menu.plats.filter(function(item) {return item!="";});
                        menu.desserts = menu.desserts.filter(function(item) {return item!="";});
                        var savedMenu = restaurant.menus.id(menu._id);
                        if(savedMenu) {
                            var indexOfMenu = restaurant.menus.indexOf(savedMenu);
                            restaurant.menus.splice(indexOfMenu,1,menu);
                        }
                    }

                    restaurant.save(function(err, restaurant) {
                        if(err) return res.json({status:"error", data:{message:"message"}});
                        return res.json({status:"success", data:{menus:restaurant.menus}});
                    })
                }
            })
        },
        deleteMenu: function(req, res, next) {
            var afficheId = req.body.afficheId;
            var menuId = req.body.menuId;
            database.Restaurant.findById(afficheId,function(err,restaurant) {
                if(err) {
                    return next(err);
                }
                var savedMenu = restaurant.menus.id(menuId);
                if(savedMenu) {
                    var indexOfMenu = restaurant.menus.indexOf(savedMenu);
                    restaurant.menus.splice(indexOfMenu,1);
                }

                restaurant.save(function(err) {
                    if(err) {
                        return next(err);
                    }
                    return res.json({ok:true,restaurant:restaurant});
                })

            });
        }
    }
})(database, async);

module.exports = Fiche;