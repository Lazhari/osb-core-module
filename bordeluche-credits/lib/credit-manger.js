/**
 * Created by dark0s on 09/05/15.
 */
/**
 * Created by dark0s on 08/05/15.
 */
var database = require('../../../../database/core/database');
exports.CreditManager = (function(database){
    /**
     * List Pack credits user for consumption
     * @param userId
     * @param callback
     */
    function getPackCreditUserToConsume(userId, callback) {
        var query = {
            owner: userId,
            'numbPoints': {$gt:0},
            expired:{$gt: new Date()}
        };
        database.PackCredit.find(query).sort({expired:1}).exec(function(err, packCredits) {
            return callback(err, packCredits);
        })
    }
    function consomePointsCredit(packCredit, pointsCredit) {
        if(packCredit.numbPoints <= pointsCredit) {
            var rest = pointsCredit - packCredit.numbPoints;
            packCredit.numbPoints =0;
            return {
                packCredit: packCredit,
                rest: rest
            }
        } else {
            packCredit.numbPoints -= pointsCredit;
            return {
                packCredit: packCredit,
                rest: 0
            }
        }
    }
    var getTotalPoints = function(packCredits) {
        var totalPoints = 0;
        packCredits.forEach(function(item) {
            totalPoints+= item.numbPoints;
        });
        return totalPoints;
    };
    return {
        updatePointUser: function(req, res, next) {
            var userID = req.session.user._id;
            var points = req.query.points;
            getPackCreditUserToConsume(userID, function(err, packCredits) {
                if(err) return res.json({status: "error", data:{message:err.message}});
                if(packCredits && packCredits.length) {
                    if(getTotalPoints(packCredits)< points) {
                        return res.json({status: "error", data:{message:"Désolé! Le nombre de points que vous avez est insuffisant pour réaliser cet achat."}});
                    } else {
                        for(var i in packCredits) {
                            var packCredit = packCredits[i];
                            var objConsom = consomePointsCredit(packCredit, points);
                            points = objConsom.rest;
                            objConsom.packCredit.save();
                            if(!points)
                                break;
                        }
                        return res.json({status:"success", data:{totalPoints: getTotalPoints(packCredits)}});
                    }
                } else {
                    return res.json({status: "error", data:{message:"Vous devez recherger votre compte pour effectuer des achats!"}});
                }
            });
        },
        consumePackCreditsUser: function(userId, points, callback) {
            getPackCreditUserToConsume(userId, function(err,packCredits){
                if(err) return callback(err);
                if(packCredits && packCredits.length) {
                    if(getTotalPoints(packCredits)< points) {
                        return callback(new Error("Désolé! Le nombre de points que vous avez est insuffisant pour réaliser cet achat."))
                    } else {
                        for(var i in packCredits) {
                            var packCredit = packCredits[i];
                            var objConsom = consomePointsCredit(packCredit, points);
                            points = objConsom.rest;
                            objConsom.packCredit.save();
                            if(!points)
                                break;
                        }
                        return callback(null,getTotalPoints(packCredits));
                    }
                } else {
                    return callback(new Error(""))
                }
            });
        }

    }
})(database);