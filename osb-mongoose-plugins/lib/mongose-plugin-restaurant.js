/**
 * Created by dark0s on 19/07/15.
 */
module.exports = exports = function mongoosePluginRestaurant (schema, options) {

    schema.pre('save', function (next) {
        if (this.isModified('description')) {
            this.dateModificationDescription = new Date;
        }
        if(this.isModified())
            this.dateModificationRestaurant = new Date;
        next()
    });
};