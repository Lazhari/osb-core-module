/**
 * Created by dark0s on 03/09/15.
 */
var CouponMaing = require('./lib/coupon-mailing');

var database = require('../../../database/core/database');

exports.sendCoupon = function(req, res, next) {
    var couponId = req.body.couponId;
    var user = req.session.user;
    var internauteMail = req.body.internauteMail;

    if(internauteMail) {
        database.Coupon.findById(couponId, function(err, coupon) {
            if(err) return res.status(500).send(err);

            if(coupon) {
                CouponMaing.sendcoupon(user,internauteMail,coupon, '', function(err) {
                    if(err) return res.status(500).send(err);
                    else return res.json({message:'Mail envoyé avec succès!'});
                })
            }
        })
    } else {
        return res.status(500).send({message:"le champ mail n'est pas valide"});
    }
};
exports.CouponMailing = CouponMaing;

exports.CouponReservation = require('./lib/coupon-reservation');