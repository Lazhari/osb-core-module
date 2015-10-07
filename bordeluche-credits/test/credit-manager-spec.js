/**
 * Created by dark0s on 10/05/15.
 */
var CreditManager = require('../lib/credit-manger').CreditManager;

var should = require("should");

describe("Test Consume Credit Packs", function() {
    it("#consumePackcredit", function() {
        CreditManager.consumePackCreditsUser('53ed502497d1d4db2b1ad93e',50,function(err, numbPoint){
            numbPoint.should.equal(3150);
        })
    });
    it("#consumePackcredit", function() {
        CreditManager.consumePackCreditsUser('53ed502497d1d4db2b1ad93e',8666,function(err, numbPoint){
            err.should.equal(new Error("Désolé! Le nombre de points que vous avez est insuffisant pour réaliser cet achat."));
            numbPoint.should.equal("undefined");
        })
    })
});