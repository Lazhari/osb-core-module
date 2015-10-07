/**
 * Created by dark0s on 17/07/15.
 */
var database = require('../../../../database/core/database');

var CritiqueAcl = (function() {
    var _getProCritique = function(critiqueId, restaurantId, callback) {
        database.Critiques.findOne({_id: critiqueId, 'affiche.restaurant': restaurantId})
            .populate('affiche.restaurant','pro')
            .exec(function(err, critique) {
                if(err) return callback(err);
                if(critique) return callback(null, critique.affiche.restaurant.pro);
                else return callback(null ,-1);
            });
    };

    return {
        getProCritique: function(req ,res, next) {
            var critiqueId = req.body.critiqueId;
            var ficheId = req.body.ficheId;
            _getProCritique(critiqueId, ficheId, function(err, pro) {
                if(err) return res.status(500).send({status:500, message: err.message});
                if(pro == req.session.user._id) next();
                else return res.status(401).send({status: 401, message: "Vous n'êtes pas autorisé à postuler un commentaire"});
            })
        }
    }
})();

module.exports = CritiqueAcl;