'use strict';

/* eslint new-cap: 0 */
module.exports = function(sequelize, DataTypes, meta) {
  return sequelize.define(meta.modelName, {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    lastname: {
      type: DataTypes.STRING(250),
      allowNull: true
    }
  }, {
    timestamps: false,
    freezeTableName: true,
    tableName: meta.tableName,
    schema: meta.schema
  });
};
