/**
 * Created by dark0s on 01/06/15.
 */
var database = require('../../../../database/core/database');
var moment = require('moment');

var CouponPublicAPi = (function(database, mement) {

    var _getCouponRestaurant = function(restaurantId, callback) {
        var query = {
            restaurant: restaurantId,
            //'publishedDate.startDate': {$lte : mement().toISOString()},
            'publishedDate.endDate': {$gte : mement().toISOString()},
            'publicationStatus': 'PUBLISHED'
        };
        database.Coupon.find(query)
            .populate('restaurant','nom adresse')
            .sort({created: -1}).exec(function(err, coupons) {
            return callback(err, coupons)
        })
    };
    var _getAllCoupon = function(callback) {
        var query = {
            'publishedDate.endDate': {$gte : moment().toISOString()},
            'publicationStatus': 'PUBLISHED'
        };
        database.Coupon.find(query).sort({created: -1})
            .populate('restaurant','nom adresse')
            .exec(function(err, coupons) {
            return callback(err, coupons)
        })
    };

    var _getCouponByCategory = function(type, callback) {
        var query = {
            //'publishedDate.startDate': {$lte : new Date()},
            'publishedDate.endDate': {$gte : new Date()},
            'category.type':type,
            'publicationStatus': 'PUBLISHED'
        };
        database.Coupon.find(query)
            .populate('restaurant','nom adresse')
            .sort({created: -1}).exec(function(err, coupons) {
            return callback(err, coupons)
        })
    };

    var _getCouponByQuery = function(query, callback) {
        var query = {
            //'publishedDate.startDate': {$lte : new Date()},
            'publishedDate.endDate': {$gte : new Date()},
            'category.type':query.type,
            'zone.ville':query.city,
            'restaurant':query.restaurant
        };
        database.Coupon.find(query)
            .populate('restaurant','nom adresse')
            .sort({created: -1}).exec(function(err, coupons) {
            return callback(err, coupons)
        })
    };

    var _getCouponByCity = function(city, callback) {
        var query = {
            //'publishedDate.startDate': {$lte : new Date()},
            'publishedDate.endDate': {$gte : new Date()},
            'publicationStatus': 'PUBLISHED',
            'zone.ville':city
        };
        database.Coupon.find(query)
            .populate('restaurant','nom adresse')
            .sort({created: -1}).exec(function(err, coupons) {
            return callback(err, coupons)
        })
    };

    _getCouponByUuid = function(uuid, callback) {
        var query = {
            //'publishedDate.startDate': {$lte : new Date()},
            //'publishedDate.endDate': {$gte : new Date()},
            'uuid':uuid
        };
        database.Coupon.findOne(query)
            .populate('restaurant','nom adresse')
            .exec(function(err, coupon) {
            return callback(err, coupon)
        })
    };
    _updateUsedCouponByUuid = function(uuid, callback) {
        database.Coupon.findOne({uuid: uuid}).exec(function(err, coupon) {
            if(err) return callback(err);
            if(coupon) {
                if(coupon.usage && coupon.usage.length) {
                    coupon.usage.push({
                        usageDate: new Date()
                    })
                } else {
                    coupon.usage =  [];
                    coupon.usage.push({
                        usageDate: new Date()
                    })
                }
                coupon.save(function(err, coupon) {
                    return callback(err, coupon);
                })
            } else {
                return callback(new Error('Coupon Not Found'));
            }
        })
    };
    _generateResponse = function(res, err, coupons) {
        if(err) {
            res.status(500).send({status:"error", message: err.message});
        }
        if(coupons) {
            res.status(200).send({status:"success", coupons:coupons});
        } else {
            res.status(200).send({status:"faild", message:"Coupons Not Found!"});
        }
    };

    return {
        getCouponRestaurant: function(req, res) {
            var restaurantId = req.query.restaurantId;
            _getCouponRestaurant(restaurantId, function(err, coupons) {
                _generateResponse(res, err, coupons);
            });
        },
        getAllCoupon: function(req, res) {
            _getAllCoupon(function(err, coupons) {
                _generateResponse(res, err, coupons);
            });
        },
        getCouponByCity: function(req, res) {
            var city = req.query.city;
            _getCouponByCity(city,function(err, coupons) {
                _generateResponse(res, err, coupons);
            });
        },
        getCouponByCategory: function(req, res) {
            var type = req.query.type;
            _getCouponByCategory(type, function(err, coupons) {
                _generateResponse(res, err, coupons);
            });
        },
        getCouponByQuery: function(req, res) {
            var restaurantId = req.query.restaurantId;
            var city = req.query.city;
            var type = req.query.type;
            var query = {
                city: city,
                restaurant: restaurantId,
                type: type
            };
            _getCouponByQuery(query, function(err, coupons) {
                _generateResponse(res, err, coupons);
            });
        },
        getCouponByUuid: function(req, res) {
            var uuid = req.query.uuid;
            _getCouponByUuid(uuid, function(err, coupon) {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                res.header('Access-Control-Allow-Headers', 'Content-Type');
                if(err) {
                    res.status(500).send({status:"error", message: err.message});
                }
                if(coupon) {
                    res.status(200).send({status:"success", coupon:coupon});
                } else {
                    res.status(200).send({status:"faild", message:"Coupons Not Found!"});
                }
            })
        },
        updateUsedCouponByUuid: function(req, res) {
            var uuid = req.body.uuid;
            _updateUsedCouponByUuid(uuid, function(err, coupon) {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                res.header('Access-Control-Allow-Headers', 'Content-Type');
                if(err) {
                    res.status(500).send({status:"error", message: err.message});
                }
                if(coupon) {
                    database.Restaurant.findById(coupon.restaurant).select('nom').exec(function(err, restaurant) {
                        if(err) {
                            res.status(200).send({status:"success", coupon:coupon, nomRestaurant:''});
                        }
                        if(restaurant) {
                            res.status(200).send({status:"success", coupon:coupon, nomRestaurant: restaurant.nom});
                        } else {
                            res.status(200).send({status:"success", coupon:coupon, nomRestaurant:''});
                        }
                    });
                } else {
                    res.status(200).send({status:"faild", message:"Coupons Not Found!"});
                }
            })
        }
    }

}(database, moment));

module.exports = CouponPublicAPi;