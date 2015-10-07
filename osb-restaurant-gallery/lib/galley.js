/**
 * Created by dark0s on 02/07/15.
 */
var database = require('../../../../database/core/database');
var check = require('validator').check;
var sanitize = require('validator').sanitize;
var moment = require('moment');
var helper = require('../../../../helper');
var fs = require('fs');
var Gallery = (function(database, check, sanitize, moment, helper, fs) {

    var _saveNewImage = function (restaurant, imageObject, callback) {
        if(!restaurant.gallery) {
            restaurant.gallery = {
                images: []
            };
        }
        restaurant.gallery.updated = new Date();
        restaurant.gallery.images.push(imageObject);
        restaurant.save(function(err, restaurant){
            return callback(err, restaurant);
        });
    };

    var _deleteImage = function(ficheId, imageId, callback) {
        database.Restaurant.findById(ficheId, function(err, restaurant) {
            if(err) return callback(err);
            if(restaurant) {
                var image = restaurant.gallery.images.id(imageId);
                if(image) {
                    restaurant.gallery.images.splice(restaurant.gallery.images.indexOf(image),1);
                    fs.unlink(helper.appRoot+"/public"+image.src,function(err) {
                        if(err) {
                            console.error(err.stack);
                        }
                    });
                    restaurant.save(function(err, restaurant) {return callback(err, restaurant)});
                } else {
                    return callback(new Error("Photo non trouvée"));
                }
            } else {
                return callback(new Error("Restaurant n'existe plus dans notre base de données"));
            }
        });
    };

    var _editImage = function(ficheId, imageObject, callback) {
        database.Restaurant.findById(ficheId, function(err, restaurant) {
            if(err) return callback(err);
            if(restaurant) {
                var image = restaurant.gallery.images.id(imageObject._id);
                if(image) {
                    //Clean XSS Risk
                    imageObject.label = sanitize(imageObject.label).xss();
                    imageObject.description = sanitize(imageObject.description).xss();

                    restaurant.gallery.images.splice(restaurant.gallery.images.indexOf(image),1);
                    restaurant.gallery.updated = new Date();
                    image.updated = new Date();
                    restaurant.gallery.images.push(imageObject);
                    restaurant.save(function(err, restaurant) {return callback(err, restaurant)});
                } else {
                    return callback(new Error("Photo non trouvée"));
                }
            } else {
                return callback(new Error("Restaurant n'existe plus dans notre base de données"));
            }
        })
    };

    return {
        saveImage: function(req, res, next) {
            var ficheId = req.body.restaurant;
            var image = req.body;
            var userId = req.session.user._id;
            database.Restaurant.findById(ficheId, function(err, restaurant) {
                if(err) return res.status(200).send({status:"error", message: "Une Erreur est produite lors de récupération de restaurant"});
                if(restaurant) {
                    if(restaurant.gallery && restaurant.gallery.images && restaurant.gallery.images.length>=20) {
                        return res.status(200).send({status:"failed", message:"Vous avez déjà 20 photos"});
                    } else {
                        try {
                            check(image.label,"Veuillez entrez un titre valide").notEmpty();
                        }
                        catch(err) {
                            err.custom = true;
                            return res.json({status:"failed", data:{message: err.message}});
                        }

                        if(req.files && req.files.file) {
                            var uploadFile = helper.uploadFile;
                            var allowedImageExts = helper.allowedImageExts;

                            var fileName = sanitize(image.label).toFilename()+"-"+new Date().getTime();
                            var extension = path.extname(req.files.file.name);

                            var destFolder = helper.appRoot+"/public/restaurants/"+ficheId+"/gallery/";
                            var imageUrl = "/restaurants/"+ ficheId+"/gallery/"+fileName+extension;

                            uploadFile(req.files.file,destFolder,fileName,allowedImageExts,function(upRes) {
                                if(upRes.err) {
                                    upRes.err.custom = true;
                                    res.status(500).send({status:"error", data:{message:"Erreur est produite au moment de sauvegarde"}});
                                }
                                var imageObject= {
                                    label: sanitize(image.label).xss(),
                                    src : imageUrl,
                                    description: image.description ? sanitize(image.description).xss():'',
                                    status: image.status
                                };
                                _saveNewImage(restaurant, imageObject, function(err, restaurant) {
                                    if(err) {
                                        return res.status(200).send({status:"error", data:{message:"Erreur est produite au moment de sauvegarde de la photo"}});
                                    }
                                    return res.status(200).send({status:"success", gallery: restaurant.gallery});
                                });
                            });
                        } else {
                            res.json({status:"error", data:{message:"Vous devez spécifier une image"}})
                        }
                    }
                } else {
                    return res.status(200).send({status:"error", message:"Le restaurant n'exite plus dans notre base de données"});
                }
            });
        },
        editImageFile: function(req, res) {
            var ficheId = req.body.ficheId;
            var imageId = req.body.imageId;
            database.Restaurant.findById(ficheId, function(err, restaurant) {
                if(err) return res.status(200).send({status:"error", message: "Une Erreur est produite lors de récupération de restaurant"});
                if(restaurant) {
                    console.log(restaurant);
                    if(restaurant.gallery && restaurant.gallery.images && restaurant.gallery.images.length>=20) {
                        return res.status(200).send({status:"failed", message:"Vous avez déjà 20 photos"});
                    } else {
                        var imageSaved = restaurant.gallery.images.id(imageId);
                        if(imageSaved) {
                            console.log('Image saved ');
                            if(req.files && req.files.file) {
                                var uploadFile = helper.uploadFile;
                                var allowedImageExts = helper.allowedImageExts;

                                var fileName = sanitize(imageSaved.label).toFilename()+"-"+new Date().getTime();
                                var extension = path.extname(req.files.file.name);

                                var destFolder = helper.appRoot+"/public/restaurants/"+ficheId+"/gallery/";
                                var imageUrl = "/restaurants/"+ ficheId+"/gallery/"+fileName+extension;
                                // Delete Old Image
                                // Delete Old image
                                fs.unlink(helper.appRoot+"/public"+imageSaved.src,function(err) {
                                    if(err) {
                                        console.error(err.stack);
                                    }
                                });
                                uploadFile(req.files.file,destFolder,fileName,allowedImageExts,function(upRes) {
                                    if(upRes.err) {
                                        upRes.err.custom = true;
                                        res.status(500).send({status:"error", data:{message:"Erreur est produite au moment de sauvegarde"}});
                                    }
                                    var indexOfImage = restaurant.gallery.images.indexOf(imageSaved);
                                    imageSaved.src = imageUrl;
                                    imageSaved.updated = new Date();
                                    restaurant.gallery.images.splice(indexOfImage,1,imageSaved);
                                    restaurant.save(function(err, restaurant) {
                                        if(err) {
                                            return res.status(200).send({status:"error", data:{message:"Erreur est produite au moment de sauvegarde de la photo"}});
                                        }
                                        return res.status(200).send({status:"success", gallery: restaurant.gallery});
                                    });
                                });
                            } else {
                                return res.json({status:"error", data:{message:"Vous devez spécifier une photo"}});
                            }
                        } else {
                            return res.json({status:"error", message:"Vous devez spécifier une photo"});
                        }
                    }
                } else {
                    return res.status(200).send({status:"error", message:"Le restaurant n'exite plus dans notre base de données"});
                }
            });
        },
        deleteImage : function(req, res) {
            var ficheId = req.body.ficheId;
            var imageId = req.body.imageId;
            if(ficheId && imageId) {
                _deleteImage(ficheId, imageId, function(err, restaurant) {
                    if(err) return res.status(200).send({status:"error", message: err.message});
                    return res.status(200).send({status:"success", gallery: restaurant.gallery});
                })
            } else {
                return res.status(200).send({status:"error", "message":"Vous devez spécifier la photo à supprimer"});
            }
        },
        editImage: function(req, res) {
            var ficheId = req.body.ficheId;
            var image = req.body.image;
            if(ficheId && image._id) {
                _editImage(ficheId, image, function(err, restaurant) {
                    if(err) return res.status(200).send({status:"error", message: err.message});
                    return res.status(200).send({status:"success", gallery: restaurant.gallery});
                })
            } else {
                return res.status(200).send({status:"error", "message":"Vous devez spécifier la photo à supprimer"});
            }
        }
    };
})(database, check, sanitize, moment, helper, fs);

module.exports = Gallery;