/**
 * Created by dark0s on 24/05/15.
 */
/**
 * Created by dark0s on 24/05/15.
 */
/**
 * Created by dark0s on 20/05/15.
 */
var database = require('../../../../../database/core/database');
var $user= require('../../../../Common/users');
var async = require('async');
var check = require('validator').check,sanitize = require('validator').sanitize;
var moment = require('moment');
var Pro = (function(database, async, $user, check, moment){
    var autoCompletePro = function(term, callback) {
        var containsRegex =  new RegExp("^"+RegExp.escape(term).replace('i','[i|î]').replace('e','[e|é|ê|è]')+"+", 'gi');
        database.User.find({login: containsRegex, role:20}).select('login').limit(100).exec(function(err, users) {
            return callback(err, users);
        })
    };
    var _getProfilePro = function(proId, callback) {
        database.Profile.findOne({owner:proId}, function(err, profile) {
            return callback(err, profile);
        })
    };
    var _saveProfileUser= function(userId, profileObject, callback) {
        var profileInstance = {
            owner: userId,
            age: (profileObject && profileObject.age)? profileObject.age:'',
            humeur: [],
            phone:{
                typePhone:[],
                os: []
            },
            fai:[],
            infoRestaurant:{}
        };

        if(profileObject.fai)
            profileInstance.fai = profileObject.fai;
        if(profileObject.phone && profileObject.phone.typePhone)
            profileInstance.phone.typePhone = profileObject.phone.typePhone;
        if(profileObject.phone && profileObject.phone.os)
            profileInstance.phone.os = profileObject.phone.os;
        if(profileObject.humeur)
            profileInstance.humeur = profileObject.humeur;

        if(profileObject.infoRestaurant){
            profileObject.infoRestaurant.siteRef = profileObject.infoRestaurant.siteRef.map(function(item) {return item.text;});
            profileInstance.infoRestaurant = profileObject.infoRestaurant;
        }

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

                if(profileObject.fai)
                    profileInstance.fai = profileObject.fai;
                if(profileObject.phone && profileObject.phone.typePhone)
                    profileInstance.phone.typePhone = profileObject.phone.typePhone;
                if(profileObject.phone && profileObject.phone.os)
                    profileInstance.phone.os = profileObject.phone.os;
                if(profileObject.humeur)
                    profileInstance.humeur = profileObject.humeur;

                if(profileObject.infoRestaurant){
                    profileObject.infoRestaurant.siteRef = profileObject.infoRestaurant.siteRef.map(function(item) {return item.text;});
                    profileInstance.infoRestaurant = profileObject.infoRestaurant;
                }

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
        createPro: function(req, res, next) {
            var nom = req.body.user.nom;
            var prenom = req.body.user.prenom;
            var mail = req.body.user.mail;
            var ficheId = req.body.ficheId;
            try {
                check(mail,"L'email fourni n'est pas valide !").len(6, 64).isEmail();
                check(nom,"Veillez entrer un nom valide").notEmpty();
                check(prenom,"Veillez entrer un prénom valide").notEmpty();
            }
            catch(err) {
                return res.json({'status':'failed',data:{message:err.message}});;
            }

            //var lauchActivation = req.body.active == "on";

            var user = {
                login : mail,
                mail: mail,
                nom :nom,
                prenom: prenom,
                active: true
            };

            $user.createUser(user,$user.ROLES.PRO,function(err, user) {
                if(err) return res.json({'status':'error',data:{message:err.message}});
                async.parallel([
                    function sendMailtoPro(callback) {
                        $user.generatePasswordAndSendMailBySendGrid(user, req, function(err,token) {
                            return callback(err, user);
                        });
                    },
                    function assingPro(callback) {
                        database.Restaurant.findById(ficheId, function(err, fiche) {
                            if(err) return callback(err);
                            if(fiche) {
                                fiche.pro = user._id;
                                fiche.save(function(err, restaurant) {
                                    return callback(err, restaurant);
                                })
                            }
                            //return callback(null);
                        })
                    }
                ], function(err, data) {
                    if(err) return res.json({'status':'error',data:{message:err.message}});
                    return res.json({'status':'success',data:{user: user}});
                });

            });
        },
        assignPro: function(req, res, next) {
            var ficheId = req.body.ficheId;
            var proId = req.body.proId;
            async.parallel({
                pro: function(callback) {
                    database.User.findById(proId, function(err, pro) {
                        return callback(err, pro);
                    })
                },
                fiche: function(callback) {
                    database.Restaurant.findById(ficheId, function(err, restaurant) {
                        return callback(err, restaurant);
                    })
                }
            }, function(err, result) {
                if(err) return res.json({status: "error", data:{message: err.message}});
                if(result.pro && result.fiche) {
                    result.fiche.pro = result.pro._id;
                    result.fiche.save(function(err, restaurant) {
                        if(err) return res.json({status: "error", data:{message: err.message}});
                        return res.json({status: "success", data:{user: result.pro}});
                    })
                } else {
                    return res.json({status: "error", data:{message: "Erreur lors d'assignement du Pro!"}});
                }
            })
        },
        saveInfoAuth: function(req, res, next) {
            var pro = req.body.pro;
            if(pro && pro._id) {
                database.User.findById(pro._id, function(err, user) {
                    if(err) return res.json({status: "error", data:{message: err.message}});
                    if(user) {
                        user.nom = pro.nom;
                        user.prenom = pro.prenom;
                        user.mail = pro.mail;
                        user.mobile = pro.mobile;
                        user.sexe = pro.sexe;
                        user.ville = pro.ville;
                        user.birthday = moment(pro.birthday,'DD-MM-YYYY').toISOString();
                        user.save(function(err, user) {
                            if(err) return res.json({status: "error", data:{message: err.message}});
                            return res.json({status: "success", data:{user: user}});
                        })
                    } else {
                        return res.json({status: "error", data:{message: "Le pro portant l'identifiant "+ pro._id+" spécifié est introvable."}});
                    }
                })
            } else {
                return res.json({status: "error", data:{message: "Vous devez spécifier un Pro à éditer."}});
            }
        },
        updateLogin: function(req, res, next) {
            var login= req.body.login;
            var proId= req.body.prodId;
            if(proId) {
                database.User.findById(proId, function(err, user) {
                    if(err) return res.json({status: "error", data:{message: err.message}});
                    if(user) {
                        user.login = login;
                        $user.editUser(user,user.role,function(err, user) {
                            if(err) return res.json({status: "error", data:{message: err.message}});
                            return res.json({status: "success", data:{user: user}});
                        });
                    } else {
                        return res.json({status: "error", data:{message: "Le pro portant l'identifiant "+ pro._id+" spécifié est introvable."}});
                    }
                })
            } else {
                return res.json({status: "error", data:{message: "Vous devez spécifier un Pro à éditer."}});
            }
        },
        autoCompletePro: function(req, res, next) {
            var login = req.query.login;
            if(login) {
                autoCompletePro(login, function(err, users) {
                    if(err) return res.json({status: "error", data:{message: err.message}});
                    if(users) {
                        return res.json({status: "success", pros: users});
                    }
                })
            } else {
                return res.json({status: "error", data:{message: 'Vous devez spécifier term'}});
            }
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
        },
        getProfilePro: function(req, res) {
            var proId = req.body.proId;
            _getProfilePro(proId, function(err, profile) {
                if(err) {
                    console.error(err);
                    return res.json({status:"error", data:{message:"Désolé, une erreur est survenue"}});
                }
                if(profile) {
                    return res.json({status:"success", data:{profile: profile}});
                } else {
                    return res.json({status:"success", data:{profile: {}}});
                }

            })
        }
    }
})(database, async, $user, check, moment);

module.exports = Pro;