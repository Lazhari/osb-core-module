/**
 * Created by dark0s on 10/04/15.
 */
var pack = require('./pack');
var uuid = require('node-uuid');

exports.getPacksJson = function(req, res, next) {
  pack.getAllPacks(function(err,instances) {
      if(err) {
          return res.json({status:"error",data:{"message":err.message}});
      }
      if(instances) {
          return res.json({aaData:instances});
      }
  });
};

exports.getPacksByListId = function(req, res, next) {
    var listPack = req.body.listPack;
    pack.packCart(listPack,function(err, packs){
        if(err) {
            return res.json({status:"error",data:{"message":err.message}});
        }
        if(packs) {
            return res.json({"status":"success", data:{"packs" : packs}});
        }
    })
};

function getQuantity(items,id) {
    var quantity=0;
    for(var i in items){
        if(items[i].pack==id) {
            quantity = items[i].quantity;
            break;
        }
    }
    return quantity;
}
exports.checkCart = function(req, res, next) {
    var cart = req.body.data;
    var owner = req.session.user._id;
    var command = {
        owner: owner,
        tax : cart.tax,
        taxRate: cart.taxRate,
        subTotal: cart.subTotal,
        totalCost: cart.totalCost,
        items: [],
        uuid: uuid.v4()
    };
    var items = cart.items.map(function(item) {
        return {
            quantity: item.quantity,
            total: item.total,
            pack: item.id
        }
    });
    command.items = items;



    var itemIds = cart.items.map(function(item) { return item.id });
    console.log(command);
    pack.packCart(itemIds, function(err, packs) {
        if(err) return res.json({status:"error", data:{message:err.message}});
        if(packs) {
            var totalPoints = 0;
            packs.forEach(function(elet) {
                console.log(getQuantity(command.items,elet._id)),
                console.log(elet);
                totalPoints+=elet.numbPoint*getQuantity(command.items,elet._id);
            });

            command.totalPoints = totalPoints;

            pack.saveCommand(command, function(err, command) {
                if(err) return res.json({status:"error", data:{message:err.message}});
                if(command) {
                    return res.json({status:"success", data:{command:command.uuid}});
                }
            })
        }
    });
};

exports.getProCreditPoints = function(req, res, next) {
    var userId = req.session.user._id;

    pack.getUserCommandsTotalPoints(userId,function(err, packCredits) {
        if(err) return res.json({status:"error", data:{message:err.message}});
        if(packCredits) {
            var totalPoints = 0;
            packCredits.forEach(function(packCredit) {
                totalPoints+= packCredit.numbPoints;
            });
            return res.json({status:"success", data:{totalPoints: totalPoints}});
        }
    })
};

exports.getProCreditUser = function(req, res, next) {
    var userId = req.session.user._id;

    pack.getPackCreditUser(userId,function(err, packCredits) {
        if(err) return res.json({status:"error", data:{message:err.message}});
        if(packCredits) {
            return res.json({status:"success", data:{packCredits: packCredits}});
        }
    })
};

exports.getUserCommands = function(req, res, next) {
    var userId = req.session.user._id;

    pack.getUserCommandsUuid(userId, function(err, commands) {
        if(err) return res.json({status:"error", data:{message:err.message}});
        if(commands) {
            return res.json({status:"error", data:{commands:commands}});
        } else {
            return res.json({status:"error", data:{commands:[]}});
        }
    })
};

exports.getUserCommands = function(req, res, next) {
    var userId = req.session.user._id;

    pack.getUserCommandsUuid(userId, function(err, commands) {
        if(err) return res.json({status:"error", data:{message:err.message}});
        if(commands) {
            return res.json({status:"error", data:{commands:commands}});
        } else {
            return res.json({status:"error", data:{commands:[]}});
        }
    })
};

exports.getUserCommandByUuid = function(req, res, next) {
    var userId = req.session.user._id;
    var uuid = req.params.uuid;
    pack.getCommandByUuid(uuid,userId, function(err, command) {
        if(err) return res.json({status:"error", data:{message:err.message}});
        if(command) {
            return res.json({status:"error", data:command});
        } else {
            return res.json({status:"error", data:{}});
        }
    })
};

/*
exports.givePackCreditToPro = function(req, res, next) {
    var owner = req.body.owner;
    var expired = req.body.expired;
    var numbPoints = req.body.numbPoints;
    pack.savePackCredit(owner, expired, numbPoints, function(err, packCredit) {
        if(err) return res.json({status:"error", data:{message: err.message}});
        if(packCredit) {
            return res.json({status:"succeess", data:{packCredit: packCredit}});
        }
    })
};*/
