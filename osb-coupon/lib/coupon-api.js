/**
 * Created by dark0s on 31/05/15.
 */

var database = require('../../../../database/core/database');
var check = require('validator').check;
var sanitize = require('validator').sanitize;
var moment = require('moment');
var helper = require('../../../../helper');
var fs = require('fs');
var uuid = require('node-uuid');
var uniqid = require('uniqid');
var CouponMailing = require('../../osb-coupon-reservation').CouponMailing;
var async = require('async');
var ApiCoupon = (function(database, check, sanitize, moment, helper, fs, uuid) {

    var _getAllCoupons = function(callback) {
        database.Coupon.find({}, function(err, coupons) {
            return callback(err, coupons);
        })
    };

    var _getCouponById = function(couponId, callback) {
        database.Coupon.findById(couponId)
            .populate('restaurant', 'nom adresse telephone operateur')
            .exec(function(err, coupon) {
                return callback(err, coupon);
        })
    };

    var _getCallcenterActors = function(operatorId, callback) {
        database.User.findById(operatorId, function(err, operator) {
            if(err) return callback(err);
            if(operator) {
                database.User.findOne({callcenter: operator.callcenter, role:51}, function(err, adminCall) {
                    if(err) return callback(err);
                    var emails = [];
                    emails.push(operator.login);
                    emails.push(adminCall.login);
                    emails.push('younes.elkasri@gmail.com');
                    return callback(null, emails);
                })
            } else {
                return callback(null,['ste.callmarie@gmail.com','younes.elkasri@gmail.com']);
            }
        })
    };
    var _getCouponByRestaurant = function(restaurantId, callback) {
        database.Coupon.find({restaurant: restaurantId}, function(err, coupons) {
            return callback(err, coupons);
        })
    };

    var _getCoupongByQuery = function(query, callback) {
        var filter={};
        if(quer.id) {
            filter._id = id;
        }
    };

    var _deleteCoupon = function(couponId, callback) {
        database.Coupon.findById(couponId, function(err, coupon) {
            if(err) callback(err);
            if(coupon) {
                fs.unlink(helper.appRoot+"/public"+coupon.backgroudImg,function(err) {
                    if(err) {
                        console.error(err.stack);
                    }
                });
                database.Coupon.remove({_id: couponId}, function(err) {
                    return callback(err);
                })
            } else {
                return callback(new Error('Coupon Not found'));
            }
        })

    };

    var _saveCoupon = function(couponObject, callback) {
        var copon = database.Coupon(couponObject);
        copon.save(function(err, coupon) {
            return callback(err, coupon);
        })
    };

    var _updateCoupon = function(couponId, couponObject, callback) {
        database.Coupon.findById(couponId, function(err, coupon) {
            if(err) return callback(err);
            if(coupon) {
                coupon.label = couponObject.label;
                coupon.description = couponObject.description;
                coupon.nbrPersonne = couponObject.nbrPersonne;
                coupon.uuid = uuid.v4();
                coupon.uniqId = uniqid();
                coupon.category.type = couponObject.category.type;
                if(coupon.category.type && coupon.category.type =="Reduction") {
                    coupon.category.property.pourcentage = couponObject.category.property.pourcentage;
                    coupon.category.property.elementOffre= [];
                }
                if(coupon.category.type && coupon.category.type =="Offre") {
                    coupon.category.property.elementOffre = couponObject.category.property.elementOffre.map(function(item) {return item.text});
                }
                coupon.publishedDate.startDate = couponObject.publishedDate.startDate;
                coupon.publishedDate.endDate = couponObject.publishedDate.endDate;
                coupon.save(function(err) {
                    return callback(err);
                })
            } else {
                return callback(new Error("L'objet portant l'identifiant spécifié est introuvable"));
            }

        })
    };
    return {
        saveCoupon: function(req, res, next) {
            var ficheId = req.body.restaurant;
            var coupon = req.body;
            var userId = req.session.user._id;
            try {
                check(coupon.label,"Veuillez entrez un titre valide").notEmpty();
                check(coupon.description,"Veuillez entrez une description valide").notEmpty();
            }
            catch(err) {
                err.custom = true;
                return res.json({status:"failed", data:{message: err.message}});
            }

            if(req.files && req.files.file) {
                var uploadFile = helper.uploadFile;
                var allowedImageExts = helper.allowedImageExts;

                var fileName = sanitize(coupon.label).toFilename()+"-"+new Date().getTime();
                var extension = path.extname(req.files.file.name);

                var destFolder = helper.appRoot+"/public/restaurants/"+ficheId+"/coupons/";
                var imageUrl = "/restaurants/"+ ficheId+"/coupons/"+fileName+extension;

                uploadFile(req.files.file,destFolder,fileName,allowedImageExts,function(upRes) {
                    if(upRes.err) {
                        upRes.err.custom = true;
                        res.status(500).send({status:"error", data:{message:"Erreur est produite au moment de sauvegarde du coupon"}});
                    }
                    var couponObject= {
                        label: coupon.label,
                        restaurant: coupon.restaurant,
                        nbrPersonne: coupon.nbrPersonne,
                        backgroudImg : imageUrl,
                        owner: userId,
                        uniqId : uniqid(),
                        description: coupon.description,
                        publishedDate: {
                            startDate: coupon.start,
                            endDate: coupon.end
                        },
                        zone: {
                         ville: coupon.ville,
                         departement: coupon.departement? coupon.departement:'',
                         region: coupon.region? coupon.region:''
                         },
                        uuid: uuid.v4(),
                        category: {
                            type: coupon.categoryType,
                            property: {}
                        }
                    };
                    if(coupon.categoryType && coupon.categoryType =="Reduction") {
                        couponObject.category.property.pourcentage = coupon.pourcentage;
                    }
                    if(coupon.categoryType && coupon.categoryType =="Offre") {
                        couponObject.category.property.elementOffre = coupon.elementOffre.split(',');
                    }
                    _saveCoupon(couponObject, function(err, coupon) {
                        if(err) {
                            res.status(500).send({status:"error", data:{message:"Erreur est produite au moment de sauvegarde du coupon"}});
                        }
                        _getCouponByRestaurant(ficheId, function(err, coupons) {
                            if(err) {
                                res.status(500).send({status:"error", data:{message:"Erreur est produite au moment de sauvegarde du coupon"}});
                            }
                            res.status(200).send({status:"success", data:{coupons:coupons}});
                        });
                    })
                });
            } else {
                res.json({status:"error", data:{message:"Vous devez spécifier une image"}})
            }
        },
        getCouponByRestaurant: function(req, res) {
            var restaurantId = req.query.ficheId;
            _getCouponByRestaurant(restaurantId, function(err, coupons) {
                if(err) {
                    res.status(500).send({status:"error", message: "Erreur lors de récupérations des coupons"});
                }
                if(coupons) {
                    res.status(200).send(coupons);
                } else {
                    res.status(200).send([]);
                }
            })
        },

        removeCoupon: function(req, res) {
            couponId = req.params.id;
            _deleteCoupon(couponId, function(err) {
                if(err) {
                    req.status(500).send({status:"error", message:"Erreur est produite lors de suppression de coupon"});
                }
                res.status(200).send({status:"success", message:"Coupon supprimé avec succès."})
            })
        },

        editCoupon: function(req, res) {
            coupon = req.body.coupon;
            couponId = req.params.id;
            _updateCoupon(couponId, coupon, function(err) {
                if(err) {
                    res.status(500).send({status:"error", message:"Erreur est produite lors de suppression de coupon"})
                }
                _getCouponByRestaurant(coupon.restaurant, function(err, coupons) {
                    if(err) {
                        res.status(500).send({status:"error", data:{message:"Erreur est produite au moment de sauvegarde du coupon"}});
                    }
                    res.status(200).send({status:"success", data:{coupons:coupons}});
                });
            })
        },

        editPhotoCoupon: function(req, res) {
            couponId = req.body.couponId;
            database.Coupon.findById(couponId,function(err, coupon) {
                if(err) {
                    res.status(500).send({status:"error", message:"Erreur est produite lors d'édition coupon"})
                }
                if(coupon) {
                    if(req.files.file) {
                        var uploadFile = helper.uploadFile;
                        var allowedImageExts = helper.allowedImageExts;

                        var fileName = sanitize(coupon.label).toFilename();
                        var extension = path.extname(req.files.file.name);
                        var destFolder = helper.appRoot+"/public/restaurants/"+coupon.restaurant+"/coupons/";
                        var imageUrl = "/restaurants/"+ coupon.restaurant+"/coupons/"+fileName+extension;
                        // Delete Old image
                        fs.unlink(helper.appRoot+"/public"+coupon.backgroudImg,function(err) {
                            if(err) {
                                console.error(err.stack);
                            }
                        });

                        uploadFile(req.files.file, destFolder, fileName, allowedImageExts, function(upRes) {
                            if(upRes.err) {
                                res.status(500).send({status:"error", data:{message:"Erreur est produite au moment de sauvegarde du coupon"}});
                            }
                            console.log("File Uploaded");

                            coupon.backgroudImg = imageUrl;
                            coupon.save(function(err,coupon) {
                                if(err) {
                                    res.status(500).send({status:"error", message:"Erreur est produite lors de suppression de coupon"})
                                }
                                _getCouponByRestaurant(coupon.restaurant, function(err, coupons) {
                                    if(err) {
                                        res.status(500).send({status:"error", data:{message:"Erreur est produite au moment de sauvegarde du coupon"}});
                                    }
                                    res.status(200).send({status:"success", data:{coupons:coupons}});
                                });
                            });

                        });

                    } else {
                        res.status(500).send({status:"error", message:"Vous devez spécifier une photo"})
                    }
                }
            })
        },

        distributeCoupon: function(req, res, next) {
            var couponId = req.body.id;
            var userId = req.session.user._id;
            if(couponId) {
                _getCouponById(couponId, function(err, coupon) {
                    if(err) {
                        res.status(500).send({status:"error", message:"Une erreur s'est produite lors de distribution de coupon"});
                    }
                    if(coupon) {
                        coupon.publicationStatus = 'PUBLISHED';
                        coupon.save(function(err, coupon) {
                            if(err) {
                                res.status(500).send({status:"error", message:"Une erreur s'est produite lors de distribution de coupon"});
                            }

                            _getCouponByRestaurant(coupon.restaurant, function(err, coupons) {
                                if(err) {
                                    res.status(500).send({status:"error", message:"Erreur est produite au moment de sauvegarde du coupon"});
                                }

                                _getCallcenterActors(coupon.restaurant.operateur,function(err, emails) {
                                    if(err) {
                                        return res.status(500).json({status:"error", message:"Erreur est produite au moment de l'envoi du mail"});
                                    }

                                    async.parallel([
                                        function sendMailProfunction(callback) {
                                            CouponMailing.mailDistributeCouponPro(req.session.user, coupon,'send-grid',function(err, info) {
                                                if(err) {
                                                    console.log('Error ', err);
                                                    return callback(new Error("Erreur est produite au moment de l'envoi du mail"));
                                                }
                                                return callback(null, info);
                                            });
                                        },
                                        function sendMailCallcenter(callback) {
                                            CouponMailing.mailDistributeCouponMarketing(req.session.user.login,emails, coupon,'send-grid', function(err, info) {
                                                if(err) {
                                                    console.log('Error ', err);
                                                    return callback(new Error("Erreur est produite au moment de l'envoi du mail"));
                                                }
                                                return callback(null, info);
                                            });
                                        }
                                    ], function(err,data) {
                                        if(err) {
                                            console.log(err);
                                        }
                                        console.log(data);
                                        res.status(200).send({status:"success", coupons: coupons});
                                    })

                                });
                            });
                        })
                    } else {
                        res.status(500).send({status:"error", message:"Une erreur s'est produite lors de distribution de coupon"});
                    }
                })
            } else {
                return res.json({status:"error", message:"l'identifiant de coupon est invalide"})
            }
        }

    }
}(database, check, sanitize, moment, helper, fs, uuid));

module.exports = ApiCoupon;