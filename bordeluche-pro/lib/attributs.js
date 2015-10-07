/**
 * Created by dark0s on 16/04/15.
 */
var database = require('../../../../database/core/database');

/**
 * Get Attributs By Root Id
 * @param {Number} rootId - The root Id
 * @param callback
 */
exports.getAttributsByRoot = function(rootId,callback) {
    database.Attribut.find({root:rootId,isParent:{$exists:false}}).populate('parent').exec(function(err, instances) {
        return callback(err, instances);
    });
};

exports.getParentAttributsByRoot = function(rootId,callback) {
    database.Attribut.find({root:rootId,isParent:{$exists:true}}).populate('parent').exec(function(err, instances) {
        return callback(err, instances);
    });
};

exports.getAttributByParentId = function(parentId, callback) {
    database.Attribut.find({parent:parentId}).exec(function(err, instances) {
        return callback(err, instances);
    });
};

exports.getCuisineDuMonde = function(callback) {
    database.CuisineDuMonde.find({_id:{$ne:0}}).exec(function(err, instances) {
        return callback(err,instances);
    })
};

exports.getAttributAutoComplete = function(rootId, term ,limit, callback) {
    database.Attribut.find({root:rootId, label: term}).limit(limit).exec(function(err, instances) {
        return callback(err, instances);
    });
};

exports.getAttributParentsAutoComplete = function(parentId, term ,limit, callback) {
    database.Attribut.find({parent:parentId, label: term}).limit(limit).exec(function(err, instances) {
        return callback(err, instances);
    });
};


exports.getCuisineAutoComplete = function(term, limit ,callback) {
    database.CuisineDuMonde.find({label: term}).limit(limit).exec(function(err, instances) {
        return callback(err, instances);
    });
};