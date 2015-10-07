/**
 * Created by dark0s on 07/04/15.
 */
var database = require('../../../../database/core/database');
exports.getPack = function(id,callback) {
    database.Pack.findById(id).exec(function(err,instance){
        return callback(err,instance);
    });
};

exports.getAllPacks = function(callback) {
    database.Pack.find().exec(function(err,instances) {
        return callback(err,instances);
    });
};

exports.save = function(args,callback) {
    var packObject = {
        name: args.name,
        price: args.price,
        description: args.description,
        color: args.color,
        numbPoint: args.numbPoint
    };
    var packInstance = database.Pack(packObject);
    packInstance.save(function(err,instance){
        return callback(err,instance);
    });
};

exports.delete = function(idPack,callback) {
  database.Pack.remove({_id:idPack},function(err) {
      return callback(err);
  })
};

exports.packCart = function(idPacks, callback) {
    database.Pack.find({_id:{$in:idPacks}},function(err,packs) {
        return callback(err,packs)
    })
};

exports.saveCommand = function(commandObject, callback) {
    var commandInstance = database.Command(commandObject);
    commandInstance.save(function(err,command) {
        return callback(err, command);
    });
};

exports.getUserCommandsTotalPoints = function(userId, callback) {
    database.PackCredit.find({owner: userId,expired:{$gt: new Date()}}).select('numbPoints').exec(function(err, packCredit) {
        return callback(err, packCredit);
    });
};

exports.getPackCreditUser = function(userId, callback) {
    database.PackCredit.find({owner: userId,expired:{$gt: new Date()}, numbPoints:{$gt:0}}).exec(function(err, packCredit) {
        return callback(err, packCredit);
    });
};

exports.getUserCommandsUuid = function(userId, callback) {
    database.Command.find({owner: userId, status:{$exists:false}}).select('uuid created').exec(function(err, commands) {
        return callback(err, commands);
    })
};

exports.getCommandByUuid = function(uuid,userId, callback) {
    database.Command.findOne({uuid: uuid, owner:userId, status:{$exists:false}}).populate('items.pack').exec(function(err, command) {
        return callback(err, command);
    })
};

exports.getCommandByUuidForPayment = function(uuid,userId, callback) {
    database.Command.findOne({uuid: uuid, owner:userId, status:{$exists:false}}).exec(function(err, command) {
        return callback(err, command);
    })
};

exports.giftPackCredit = function(owner, expired, numbPoints,operator,callback) {
    var moment = require('moment');
    var packCreditInstance = database.PackCredit({
        owner: owner,
        numbPoints: numbPoints,
        expired: moment().add(expired, 'day').toISOString(),
        command: '000000000000000000000000',
        giftLog: {
            operator: operator._id,
            mail: operator.login,
            dateGift: new Date()
        }
    });
    packCreditInstance.save(function(err, packCredit) {
        return callback(err, packCredit);
    });
};