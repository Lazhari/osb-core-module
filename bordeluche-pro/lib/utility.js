/**
 * Created by dark0s on 06/05/15.
 */
var database = require('../../../../database/core/database');
var moment = require('moment');
var check = require('validator').check,sanitize = require('validator').sanitize;
var helper =require("../../../../helper");
var CreditManager = require("../../bordeluche-credits/lib/credit-manger").CreditManager;
var fs = require('fs');
var uuid = require('node-uuid');
exports.uploadItemsPhoto = function(req, res, next) {
    var afficheId = req.body.restaurantId;
    var label = req.body.label;
    var userId = req.session.user._id;
    try {
        check(label,"Veuillez entrez un titre valide").notEmpty();
    }
    catch(err) {
        err.custom = true;
        return next(err);
    }

    database.Restaurant.findById(afficheId, function(err,restaurant) {
        if(err)
            return next(err);

        console.log("req files :",req.files);
        if(req.files.file) {
            CreditManager.consumePackCreditsUser(userId, 50, function(err, restpoints) {
                if(err) return res.json({status:"error", data:{message: err.message}});

                else {
                    var uploadFile = helper.uploadFile;
                    var allowedImageExts = helper.allowedImageExts;

                    var fileName = sanitize(label).toFilename()+"-"+new Date().getTime();
                    var extension = path.extname(req.files.file.name);

                    var destFolder = helper.appRoot+"/public/restaurants/"+restaurant._id+"/";
                    var imageUrl = "/restaurants/"+ restaurant._id+"/"+fileName+extension;

                    uploadFile(req.files.file,destFolder,fileName,allowedImageExts,function(upRes) {
                        if(upRes.err) {
                            upRes.err.custom = true;
                            return next(err);
                        }
                        console.log("File Uploaded");
                        var image = {};
                        image.dateCreation = new Date();
                        image.dateExpiration = moment().add(60, 'day').toISOString();
                        image.src = imageUrl;
                        image.label = label;
                        image.publier= 'Y';

                        image.statu = {value:"PAYEE",dateStatu:new Date()};
                        image.status = [];
                        image.status.push(image.statu);

                        image.tag =req.body.tag;

                        //var nbImg = restaurant.Images? restaurant.Images.length+1 : 1;
                        //restaurant.imagesGratuitesDisponibles = conf.imagesGratuites-nbImg;
                        //var paymentMsg = restaurant.imagesGratuitesDisponibles<0;
                        //image.prix = restaurant.imagesGratuitesDisponibles>=0 ? 0 : image.prix;
                        //var elemIdx = restaurant.Images.push(image)-1;
                        restaurant.Images.push(image);
                        restaurant.save(function(err,restaurant) {
                            if(err)
                                return next(err);
                            console.log(restaurant.Images);
                            res.json({status:"success", data:{restPoints: restpoints, images: restaurant.Images}});
                        });

                    });
                }
            });

        }
        else {
            return next(new Error("Aucune image reçue"));
        }
    });
};

exports.getImageById = function(req, res, next) {
    var ficheId = req.body.ficheId;
    var imageId = req.body.imageId;

    database.Restaurant.findById(ficheId).select('Images').exec(function(err, restaurant) {
        if(err) return res.json({status:"error", data:{message: err.message}});
        if(restaurant.Images && restaurant.Images.length) {
            var image = restaurant.Images.id(imageId);
            return res.json({status: "success" , data: {image: image}});
        } else {
            return res.json({status: "success" , data: {image: {}}});
        }
    })
};

exports.editImage = function(req, res, next) {
    var afficheId = req.body.afficheId;
    var imageId = req.body.imageId;
    var label = req.body.label;
    try {
        check(label,"Veuillez entrez un titre valide").notEmpty();
    }
    catch(err) {
        err.custom = true;
        return next(err);
    }
    database.Restaurant.findById(afficheId, function(err,restaurant) {
        if(err) return res.json({status:"error", data:{message: err.message}});
        var image = restaurant.Images.id(imageId);

        if(req.files.file) {
            var uploadFile = helper.uploadFile;
            var allowedImageExts = helper.allowedImageExts;

            var fileName = sanitize(label).toFilename();
            var extension = path.extname(req.files.file.name);
            var destFolder = helper.appRoot+"/public/restaurants/"+restaurant._id+"/";
            var imageUrl = "/restaurants/"+ restaurant._id+"/"+fileName+extension;
            // Delete Old image
            fs.unlink(helper.appRoot+"/public"+image.src,function(err) {
                if(err) {
                    console.error(err.stack);
                }
            });

            uploadFile(req.files.file, destFolder, fileName, allowedImageExts, function(upRes) {
                if(upRes.err) {
                    return res.json({status:"error", data:{message: err.message}});
                }
                console.log("File Uploaded");

                image.src = imageUrl;
                image.label = label;
                restaurant.save(function(err,restaurant) {
                    if(err) res.json({status:"error", data:{message: err.message}});
                    var image = restaurant.Images.id(imageId);
                    return res.json({status:"success", data:{image: image}})
                });

            });

        }
        else {
            image.label = label;
            restaurant.save(function(err) {
                if(err) res.json({status:"error", data:{message: err.message}});

                return res.json({status:"success", data:{image: image}});
            });
        }
    });
};

ImageGrid = (function(database){
    function gridAlreadyExists(userId, restaurantId, callback) {
        database.Grid.findOne({owner:userId, restaurant:restaurantId},function(err,grid) {
            return callback(err, grid);
        });
    }
    function createNewUserGrid(userId, configArray, restaurantId) {
        var gridObject = {
            owner: userId,
            restaurant: restaurantId,
            positions: []
        };

        configArray.forEach(function(elet) {
            gridObject.positions.push({price: elet});
        });
        return database.Grid(gridObject);
    }
    function updateConfigGrid(grid, configArray) {
        var positions = grid.positions;
        var newPositions = positions.map(function(elet,index) {
            if(!elet.reserved) {
                elet.price = configArray[index];
            }
            return elet;
        });
        return newPositions;
    }

    function getConfigGrid(callback) {
        database.Configuration.findById(0).select('grille.grilleInfosTechnique').exec(function(err,conf) {
            return callback(err, conf);
        })
    }
    return {
        getUserGrid : function(userId,restaurantId, callback) {
            gridAlreadyExists(userId, restaurantId, function(err, grid) {
                if(err) return callback(err);
                if(grid) {
                    getConfigGrid(function(err, conf) {
                        if(err) return callback(err);
                        var positions = updateConfigGrid(grid, conf.grille.grilleInfosTechnique);

                        grid.positions= positions;
                        grid.save(function(err, grid) {
                            return callback(err, grid);
                        })
                    });
                } else {
                    getConfigGrid(function(err, conf) {
                        if(err) return callback(err);
                        console.log(conf.grille.grilleInfosTechnique);
                        if(conf) {
                            var gridInstance = createNewUserGrid(userId, conf.grille.grilleInfosTechnique, restaurantId);
                            gridInstance.save(function(err, grid) {
                                return callback(err, grid);
                            })
                        }
                    });
                }
            });
        }

    }
})(database);

exports.getUserGrid = function(req, res, next) {
    var userId = req.session.user._id;
    var restaurantId = req.params.restaurantId;
    if(userId && restaurantId) {
        ImageGrid.getUserGrid(userId, restaurantId, function(err, grid) {
            if(err) return res.json({status:"error", data:{message:err.message}});
            if(grid) {
                return res.json({status:"success", data:{grid:grid}});
            } else {
                return res.json({status:"error", data:{grid:{}}});
            }
        });
    } else {
        return res.json({status:"error", data:{message:"User ID and Restaurant ID is required !"}});
    }
};

exports.updateUserGrid = function(req, res, next) {
    var grid = req.body.grid;
    var points = req.body.points;
    var userId = req.session.user._id;


    CreditManager.consumePackCreditsUser(userId, points, function(err, restpoints) {
        if(err) return res.json({status:"error", data:{message: err.message}});

        else {
            var positions = grid.positions.map(function(elet) {
                if(elet.reserved && !elet.expired) {
                    elet.expired = moment().add(60, 'day').toISOString();
                    return elet;
                } else {
                    return elet;
                }
            });
            database.Grid.findById(grid._id).exec(function(err, grid) {
                if(err) return res.json({status:"error", data:{message:err.message}});
                if(grid) {
                    grid.positions = positions;
                    grid.updated = new Date();
                    grid.save(function(err){
                        if(err) return res.json({status:"error", data:{message:err.message}});
                        else {
                            return res.json({status:"success", data:{points: restpoints, grid: grid}});
                        }
                    })
                }
            });
        }
    })


};

exports.reserveAppCoupon = function(req, res, next) {
    var userId = req.session.user._id;
    var periode = req.body.periode;
    var points = req.body.points;
    database.User.findById(userId).exec(function(err, user) {
        if(err) return res.json({status:"error", data:{message: err.message}});
        if(user) {
            CreditManager.consumePackCreditsUser(userId, points, function(err, restpoints) {
                if(err) res.status(200).send({status:"Failed", data:{message:err.message}});

                else {
                    var couponApp = {
                        expired: moment().add(periode, 'day').toISOString(),
                        token: uuid.v4()
                    };
                    user.couponApp = couponApp;
                    user.save(function(err, user) {
                        if(err) res.status(403).send({status:"Failed", data:{message:"Erreur est produite lors de reservation de l'application Coupon"}});
                        return res.json({status:"success", data:{points: restpoints, tokenApp: user.couponApp.token}});
                    });
                }
            })

        } else {
            res.status(403).send({status:"Failed", data:{message:"Erreur est produite lors de reservation de l'application Coupon"}});
        }
    })
};

exports.checkCouponApp = function(req, res, next) {
    var userId = req.session.user._id;
    database.User.findOne({_id: userId, 'couponApp.expired':{$gt: new Date()}}, function(err, user) {
        if(err) res.status(500).send({status:"error", data:{message: "Erreur est produite lors de vérification de token Application"}});
        if(user) {
            if(user.couponApp) {
                res.status(200).send({status:"success", data:{token: user.couponApp}});
            }
        } else {
            res.status(200).send({status:"failed", data:{message: "Erreur est produite lors de vérification de token Application"}});
        }
    })
}
