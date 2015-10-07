/**
 * Created by dark0s on 25/05/15.
 */
/**
 * Created by dark0s on 24/05/15.
 */
/**
 * Created by dark0s on 24/05/15.
 */
/**
 * Created by dark0s on 20/05/15.
 */
var database = require('../../../../database/core/database');
var $user= require('../../../Common/users');
var async = require('async');
var moment = require('moment');
var check = require('validator').check,sanitize = require('validator').sanitize;
var Internaute = (function(database, async, $user, check, sanitize, moment){

    var _getOperateurInternautes = function(operatorId, callback) {
        database.User.find({operator: operatorId, role: 10}).exec(function(err, users) {
            return callback(err, users);
        })
    };

    var _getOperateurInternauteById = function(operateurId, internauteId, callback) {
        async.parallel({
            user: function(callback) {
                database.User.findOne({operator:operateurId, _id: internauteId}, function(err, user) {
                    return callback(err, user);
                })
            },
            profile: function(callback) {
                database.Profile.findOne({owner: internauteId}, function(err, profile) {
                    return callback(err, profile);
                })
            }
        }, function(err, data) {
            return callback(err, data);
        })

    };

    var _saveProfileUser= function(userId, profileObject, callback) {
        var profileInstance = {
            owner: userId,
            age: profileObject.age? profileObject.age:'',
            preference: {
                restaurants: [],
                plats: [],
                options: [],
                cuisines: [],
                paiement: []
            },
            frequentation: {
                creneaux: []
            },
            humeur: [],
            phone:{
                typePhone:[],
                os: []
            },
            fai:[]
        };
        if(profileObject.preference && profileObject.preference.restaurants) {
            profileInstance.preference.restaurants = profileObject.preference.restaurants.map(function(restaurant) {
                var patternName = restaurant.label.split(',');
                return {
                    nom: patternName[0].trim(),
                    ville: patternName[1]? patternName[1].trim():'',
                    idRestuarant: restaurant.id
                }
            });
        }
        if(profileObject.preference && profileObject.preference.plats) {
            profileInstance.preference.plats = profileObject.preference.plats;
        }
        if(profileObject.preference && profileObject.preference.cuisines) {
            profileInstance.preference.cuisines = profileObject.preference.cuisines;
        }
        if(profileObject.preference && profileObject.preference.options) {
            profileInstance.preference.options = profileObject.preference.options;
        }
        if(profileObject.preference && profileObject.preference.paiement) {
            profileInstance.preference.paiement = profileObject.preference.paiement;
        }
        if(profileObject.frequentation && profileObject.frequentation.creneaux) {
            profileInstance.frequentation.creneaux = profileObject.frequentation.creneaux;
        }
        if(profileObject.frequentation && profileObject.frequentation.mode) {
            profileInstance.frequentation.mode = profileObject.frequentation.mode;
        }
        if(profileObject.fai)
            profileInstance.fai = profileObject.fai;
        if(profileObject.phone && profileObject.phone.typePhone)
            profileInstance.phone.typePhone = profileObject.phone.typePhone;
        if(profileObject.phone && profileObject.phone.os)
            profileInstance.phone.os = profileObject.phone.os;
        if(profileObject.humeur)
            profileInstance.humeur = profileObject.humeur;

        // Instanciation de l'objet
        profileInstance = database.Profile(profileInstance);
        profileInstance.save(function(err, profile) {
            return callback(err, profile);
        });
    };

    var _editProfileUser= function(userId, profileObject, profileId, callback) {
        database.Profile.findById(profileId, function(err, profileInstance) {
            if (err) return callback(err);
            if(profileInstance) {
                profileInstance.age= profileObject.age? profileObject.age:'';

                if(profileObject.preference && profileObject.preference.restaurants) {
                    profileInstance.preference.restaurants = profileObject.preference.restaurants.map(function(restaurant) {
                        var patternName = restaurant.label.split(',');
                        return {
                            nom: patternName[0].trim(),
                            ville: patternName[1]? patternName[1].trim():'',
                            idRestuarant: restaurant.id
                        }
                    });
                }
                if(profileObject.preference && profileObject.preference.plats) {
                    profileInstance.preference.plats = profileObject.preference.plats;
                }
                if(profileObject.preference && profileObject.preference.cuisines) {
                    profileInstance.preference.cuisines = profileObject.preference.cuisines;
                }
                if(profileObject.preference && profileObject.preference.options) {
                    profileInstance.preference.options = profileObject.preference.options;
                }
                if(profileObject.preference && profileObject.preference.paiement) {
                    profileInstance.preference.paiement = profileObject.preference.paiement;
                }
                if(profileObject.frequentation && profileObject.frequentation.creneaux) {
                    profileInstance.frequentation.creneaux = profileObject.frequentation.creneaux;
                }
                if(profileObject.frequentation && profileObject.frequentation.mode) {
                    profileInstance.frequentation.mode = profileObject.frequentation.mode;
                }
                if(profileObject.fai)
                    profileInstance.fai = profileObject.fai;
                if(profileObject.phone && profileObject.phone.typePhone)
                    profileInstance.phone.typePhone = profileObject.phone.typePhone;
                if(profileObject.phone && profileObject.phone.os)
                    profileInstance.phone.os = profileObject.phone.os;
                if(profileObject.humeur)
                    profileInstance.humeur = profileObject.humeur;

                // Instanciation de l'objet
                profileInstance.save(function(err, profile) {
                    return callback(err, profile);
                });
            } else {
                return callback(new Error('Profile Not Found'));
            }
        });

    };

    return {
        /**
         * Sending mail to pro
         * @param {Request} req - Request Object
         * @param {Response} res - Response Object
         * @param {function} next - the callback function
         */
        sendMailToPro : function(req, res, next ) {
            var proId = req.query.proId;
            if(req.session.user.role===1) {
                database.User.findById(proId.trim(),function(err,user) {
                    if(err) {
                        return res.json({'status':'error',data:{message:err.message}});
                    }
                    $user.generatePasswordAndSendMailBySendGrid(user,req,function(err,token) {
                        if(err) return res.json({'status':'error',data:{message:err.message}});

                        return res.json({'status':'success', data: { message:'Mail envoyé avec succées!'}});
                    });
                });
            }
        },
        activateInternaute: function(req, res, next) {
            var user = req.body.user;
            var mail = req.body.user.mail;
            var nom = req.body.user.nom;
            var prenom = req.body.user.prenom;
            var ville = req.body.user.ville;
            var mobile = req.body.user.mobile;
            var operatorId= req.session.user._id;
            if(user && user._id) {
                database.User.findById(user._id, function(err, user) {
                    if(err){
                        return res.json({status:"error", data:{message:"Une Exception s'est produite lors de l'activation de l'internaute"}});
                    }
                    if(user) {
                        try {
                            check(mail,"L'email fourni n'est pas valide !").len(6, 64).isEmail();
                            check(nom,"Veillez entrer un nom valide").notEmpty();
                            check(prenom,"Veillez entrer un prénom valide").notEmpty();
                            check(ville,"Veillez entrer une ville valide").notEmpty();
                            check(mobile,"Veillez entrer un numéro de téléphone valide").notEmpty();
                        }
                        catch(err) {
                            return res.json({'status':'failed',data:{message:err.message}});;
                        }

                        //var lauchActivation = req.body.active == "on";

                        user.login = mail;
                        user.mail =mail;
                        user.nom =nom;
                        user.prenom= prenom;
                        user.ville=ville;
                        user.mobile=mobile;
                        user.active= true;
                        user.operator= operatorId;

                        $user.editUser(user,10,function(err, user) {
                            //if(err) return res.json({'status':'error',data:{message:err.message}});
                            if(err) return res.json({'status':'error',data:{message:err.message}});
                            $user.generatePasswordAndSendMailBySendGrid(user, req, function(err,token) {
                                if(err) return res.json({'status':'error',data:{message: err.message}});
                                return res.json({'status':'success',data:{user: user}});
                            });
                        });
                    }
                })
            }
        },
        saveInfoAuth: function(req, res, next) {
            var internaute = req.body.internaute;
            if(internaute && internaute._id) {
                database.User.findById(internaute._id, function(err, user) {
                    if(err) return res.json({status: "error", data:{message: err.message}});
                    if(user) {
                        user.nom = internaute.nom;
                        user.prenom = internaute.prenom;
                        user.mail = internaute.mail;
                        user.mobile = internaute.mobile;
                        user.sexe = internaute.sexe;
                        user.ville = internaute.ville;
                        user.birthday = moment(internaute.birthday,'DD-MM-YYYY').toISOString();
                        user.save(function(err, user) {
                            if(err) return res.json({status: "error", data:{message: err.message}});
                            return res.json({status: "success", data:{user: user}});
                        })
                    } else {
                        return res.json({status: "error", data:{message: "L'internaute portant l'identifiant "+ internaute._id+" spécifié est introvable."}});
                    }
                })
            } else {
                return res.json({status: "error", data:{message: "Vous devez spécifier un internaute à éditer."}});
            }
        },
        createInternaute: function(req, res, next) {
            var internaute = req.body.internaute;
            var operatorId= req.session.user._id;
            if(internaute) {
                var user = {};
                try {
                    check(internaute.nom,"Veillez entrer un nom valide").notEmpty();
                    check(internaute.prenom,"Veillez entrer un prénom valide").notEmpty();
                    check(internaute.ville,"Veillez entrer une ville valide").notEmpty();
                    check(internaute.mobile,"Veillez entrer un numéro de téléphone valide").notEmpty();
                }
                catch(err) {
                    return res.json({'status':'failed',data:{message:err.message}});;
                }
                user.nom = sanitize(internaute.nom).escape();
                user.prenom = sanitize(internaute.prenom).escape();
                user.mail = sanitize(internaute.mail).escape();
                user.mobile = sanitize(internaute.mobile).escape();
                user.ville = sanitize(internaute.ville).escape();
                user.operator = operatorId;
                user.role= 10;
                user = database.User(user);
                user.save(function(err, user) {
                    if(err){
                        throw err;
                        return res.json({status:"error", data:{message:"Une Exception s'est produite lors de sauvegarde de l'internaute"}});
                    }
                    return res.json({status:"success", data:{user: user}});
                })
            } else {
                return res.json({status: "error", data:{message: "Vous devez spécifier un internaute à créer."}});
            }
        },
        getOperateurInternautes: function(req, res, next) {
            var operatorId = req.session.user._id;
            _getOperateurInternautes(operatorId, function(err, users) {
                if(err) return res.json({'status':'error',data:{message:err.message}});
                return res.json({aaData: users});
            })
        },
        getOperateurInternauteById: function(req, res, next) {
            var operatorId = req.session.user._id;
            var internauteId = req.params.id;
            _getOperateurInternauteById(operatorId, internauteId, function(err, data) {
                if(err) return res.json({'status':'error',data:{message:err.message}});
                return res.json({'status':'success',data:data});
            })
        },
        saveProfileUser: function(req, res, next) {
            var profile = req.body.profile;
            var userId= req.body.userId;
            _saveProfileUser(userId, profile, function(err, profile) {
                if(err) return res.json({status: "error", data:{message: err.message}});
                return res.json({status: "success", data:{profile: profile}});
            })
        },
        editProfileUser: function(req ,res, next) {
            var profile = req.body.profile;
            var userId= req.body.userId;
            var profileId= req.body.profile._id;
            _editProfileUser(userId, profile, profileId, function(err, profile) {
                if(err) return res.json({status: "error", data:{message: err.message}});
                return res.json({status: "success", data:{profile: profile}});
            })
        }
    }
})(database, async, $user, check,sanitize, moment);

module.exports = Internaute;