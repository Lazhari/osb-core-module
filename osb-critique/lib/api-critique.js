/**
 * Created by dark0s on 13/07/15.
 */

var database = require('../../../../database/core/database');
var CritiqueApi = (function() {
    var _getCritiquesByRestaurant = function(restaurantId, callback) {
        database.Critiques
            .find({'affiche.restaurant': restaurantId})
            .populate('user','nom prenom mail')
            .exec(function(err, critiques) {
                return callback(err, critiques);
            });
    };

    return {
        getCritiquesByRestaurant: function (req, res, next) {
            var restaurantId = req.query.ficheId;
            if(restaurantId) {
                _getCritiquesByRestaurant(restaurantId, function(err, critiques) {
                    if(err) return res.status(500).send({status:500, message:"Une erreur s'est produite lors de la récupération des critiques"});
                    return res.status(200).send({status:200, results: critiques});
                })
            }
        },
        postCommentCritique: function(req, res) {
            var ficheId = req.body.ficheId;
            var critiqueId = req.body.critiqueId;
            var comment = req.body.comment;
            database.Critiques.findById(critiqueId, function(err, critique) {
                if(err) return res.status(500).send({status:500, message:"Erreur Produite lors de récupération de critique"});
                if(critique) {
                    var commentObject = {
                        userId : req.session.user._id,
                        content : comment,
                        created: new Date()
                    };
                    critique.proComment = commentObject;
                    critique.save(function(err,  critique) {
                        if(err) return res.status(500).send({status:500, message:"Erreur produite lors de sauvegarde de commentaire"});
                        _getCritiquesByRestaurant(ficheId, function(err, critiques) {
                            if(err) return res.status(500).send({status:500, message:"Une erreur s'est produite lors de la récupération des critiques"});
                            return res.status(200).send({status:200, results: critiques});
                        })
                    })
                }
            })
        }
    }
})();

module.exports = CritiqueApi;