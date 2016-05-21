'use strict';

/* eslint new-cap: 0 */
module.exports = function(sequelize, DataTypes, meta) {
  var associateCalled = false,
      dbObject;

  return {
    getMeta: function() {
      return meta;
    },
    isAssociateCalled: function() {
      return associateCalled;
    },
    getDBInAssociate: function() {
      return dbObject;
    },
    associate: function(db) {
      dbObject = db;
      associateCalled = true;
    }
  };
};
