/**
 * Created by dark0s on 24/05/15.
 */
/**
 * Created by dark0s on 20/05/15.
 */
var database = require('../../../../../database/core/database');
var async = require('async');
var Wine = (function(database, async){
    return {

        saveWine: function(req, res, next) {
            var afficheId = req.body.afficheId;
            var wine = req.body.wine;

            database.Restaurant.findById(afficheId).exec(function(err,restaurant) {
                if(err) return res.json({status:"error", data:{message:"message"}});

                if(restaurant) {
                    if(req.body.stat =="new") {
                        restaurant.vins.push(wine);
                    } else {
                        var savedWine = restaurant.vins.id(wine._id);
                        if(savedWine) {
                            var indexOfWine = restaurant.vins.indexOf(savedWine);
                            restaurant.vins.splice(indexOfWine,1,wine);
                        }
                    }

                    restaurant.save(function(err, restaurant) {
                        if(err) return res.json({status:"error", data:{message:"message"}});
                        return res.json({status:"success", data:{vins:restaurant.vins}});
                    })
                }
            })
        },
        deleteWine: function(req, res, next) {
            var afficheId = req.body.afficheId;
            var wineId = req.body.wineId;
            database.Restaurant.findById(afficheId,function(err,restaurant) {
                if(err) {
                    return next(err);
                }
                var savedWine = restaurant.vins.id(wineId);
                if(savedWine) {
                    var indexOfWine = restaurant.vins.indexOf(savedWine);
                    restaurant.vins.splice(indexOfWine,1);
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

module.exports = Wine;