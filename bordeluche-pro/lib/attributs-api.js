/**
 * Created by dark0s on 16/04/15.
 */

var attributs = require('./attributs');
var regExpEscape = function(s) {
    s = s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    s = s.replace(/e/i,'[éêèe]');
    s = s.replace(/a/i,'[aâà]');
    s = s.replace(/i/i,'[îi]');
    return s;
};
exports.getAtrributByRootId = function(req, res, next) {

    //next();
    var rootId = req.params.id;
    if(rootId) {
        attributs.getAttributsByRoot(rootId,function(err, instances){
            if(err) return res.json({status:"error",data:{message:err.message}});

            if(instances) {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                return res.json({status:"success",results:{attributs:instances}});
            } else {
                return res.json({status:"success",results:{attributs:[]}});
            }
        })
    } else {
        return res.json({status:"error",results:{message:"the root Id is required !"}});
    }
};

exports.getParentAtrributByRootId = function(req, res, next) {

    //next();
    var rootId = req.params.id;
    if(rootId) {
        attributs.getParentAttributsByRoot(rootId,function(err, instances){
            if(err) return res.json({status:"error",data:{message:err.message}});

            if(instances) {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                return res.json({status:"success",results:{attributs:instances}});
            } else {
                return res.json({status:"success",results:{attributs:[]}});
            }
        })
    } else {
        return res.json({status:"error",results:{message:"the root Id is required !"}});
    }
};

exports.getAtrributByParentId = function(req, res, next) {

    //next();
    var parentId = req.params.id;
    if(parentId) {
        attributs.getAttributByParentId(parentId,function(err, instances){
            if(err) return res.json({status:"error",data:{message:err.message}});

            if(instances) {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
                res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                return res.json({status:"success",results:{attributs:instances}});
            } else {
                return res.json({status:"success",results:{attributs:[]}});
            }
        })
    } else {
        return res.json({status:"error",results:{message:"the root Id is required !"}});
    }
};

exports.getAtrributCuisinDuMonde = function(req, res, next) {

    attributs.getCuisineDuMonde(function(err, instances){
        if(err) return res.json({status:"error",data:{message:err.message}});

        if(instances) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            return res.json({status:"success",results:{attributs:instances}});
        } else {
            return res.json({status:"success",results:{attributs:[]}});
        }
    })
};

exports.getAttributsAutoComplete = function(req, res, next) {
    //return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    var searchString = req.query.term;
    var root = req.query.root;
    var limit = req.query.limit;
    if(!searchString && !root && limit) {
        return res.json({status:"error", data:{message:"Error! you should get root and term"}});
    }
    var containsRegex =  new RegExp(regExpEscape(searchString), 'gi');
    attributs.getAttributAutoComplete(root, containsRegex,limit, function(err, attributs) {
        if(err) return res.json({status:"error", data:{message:err.message}});
        if(attributs && attributs.length) {
            return res.json({status:"error", data:{attributs: attributs}});
        } else {
            return res.json({status:"success", data:{attributs: []}});
        }
    })
};

exports.getAttributsParentAutoComplete = function(req, res, next) {
    //return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    var searchString = req.query.term;
    var parent = req.query.parent;
    var limit = req.query.limit;
    if(!searchString && !parent && limit) {
        return res.json({status:"error", data:{message:"Error! you should get root and term"}});
    }
    var containsRegex =  new RegExp(regExpEscape(searchString), 'gi');
    attributs.getAttributParentsAutoComplete(parent, containsRegex,limit, function(err, attributs) {
        if(err) return res.json({status:"error", data:{message:err.message}});
        if(attributs && attributs.length) {
            return res.json({status:"error", data:{attributs: attributs}});
        } else {
            return res.json({status:"success", data:{attributs: []}});
        }
    })
};
exports.getCuisineAutoComplete = function(req, res, next) {
    //return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    var searchString = req.query.term;
    var limit = req.query.limit;
    if(!searchString && !root && limit) {
        return res.json({status:"error", data:{message:"Error! you should get root and term"}});
    }
    var containsRegex =  new RegExp(regExpEscape(searchString), 'gi');
    attributs.getCuisineAutoComplete(containsRegex,limit, function(err, attributs) {
        if(err) return res.json({status:"error", data:{message:err.message}});
        if(attributs && attributs.length) {
            return res.json({status:"error", data:{attributs: attributs}});
        } else {
            return res.json({status:"success", data:{attributs: []}});
        }
    })
};