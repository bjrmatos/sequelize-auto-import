'use strict';

var path = require('path'),
    chai = require('chai'),
    Sequelize = require('sequelize'),
    sequelizeAutoImport = require('../src'),
    expect = chai.expect;

function fixture(fixtureName) {
  return path.join(__dirname, 'fixtures', fixtureName);
}

function getNamespacesInSequelize(sequelize) {
  var sequelizeModelsName = Object.keys(sequelize.models),
      sequelizeModelsCount = sequelizeModelsName.length,
      propertyNamespacePattern = /^.+\..+$/,
      sequelizeNamespaces = [],
      singleModels = {},
      namespacedModels = {};

  // extract the namespaces found in the sequelize instance
  sequelizeModelsName.forEach(function(modelName) {
    var namespaceParts,
        namespace,
        singleModelName;

    if (propertyNamespacePattern.test(modelName)) {
      namespaceParts = modelName.split('.');
      namespace = namespaceParts[0];
      singleModelName = namespaceParts[1];

      if (sequelizeNamespaces.indexOf(namespace) === -1) {
        namespacedModels[namespace] = {};
        sequelizeNamespaces.push(namespace);
      }

      namespacedModels[namespace][singleModelName] = sequelize.models[modelName];
    } else {
      singleModels[modelName] = sequelize.models[modelName];
    }
  });

  return {
    singleModels: singleModels,
    namespacedModels: namespacedModels,
    namespaces: sequelizeNamespaces,
    modelCount: sequelizeModelsCount
  };
}

describe('import models', function() {
  var sequelize;

  beforeEach(function() {
    sequelize = new Sequelize('test', 'test', 'test', {
      dialect: 'mysql',
      host: 'localhost',
      port: 3306
    });
  });

  it('should import models', function() {
    var models = sequelizeAutoImport(sequelize, fixture('simpleModels')),
        modelNames = Object.keys(models),
        modelsInSequelizeCount = Object.keys(sequelize.models).length;

    expect(modelNames).to.have.lengthOf(modelsInSequelizeCount);

    modelNames.forEach(function(modelName) {
      expect(sequelize.models).to.have.property(modelName, models[modelName]);
    });
  });

  it('should import models with namespaces', function() {
    var models = sequelizeAutoImport(sequelize, fixture('namespacedModels')),
        modelsNamespaces = Object.keys(models),
        modelCount = 0,
        namespacesInSequelize;

    // extract the namespaces found in the sequelize instance
    namespacesInSequelize = getNamespacesInSequelize(sequelize);

    expect(modelsNamespaces).to.have.lengthOf(namespacesInSequelize.namespaces.length);

    modelsNamespaces.forEach(function(namespace) {
      var modelNamespace = models[namespace],
          modelNames = Object.keys(modelNamespace),
          sequelizeCurrentNamespace = namespacesInSequelize.namespacedModels[namespace],
          sequelizeModelNamespaceCount = Object.keys(sequelizeCurrentNamespace).length;

      expect(modelNames).to.have.lengthOf(sequelizeModelNamespaceCount);

      modelNames.forEach(function(modelName) {
        modelCount++;
        expect(sequelizeCurrentNamespace).to.have.property(modelName, modelNamespace[modelName]);
      });
    });

    expect(modelCount).to.be.equal(namespacesInSequelize.modelCount);
  });

  it('should import single and namespaced models');

  it('should import models ignoring non js files');

  it('should import models ignoring node_modules');

  it('should import models excluding some files');

  it('should import models in one level');

  it('should import models passing model metadata'); // all fixtures

  it('should import models calling `associate` method');

  it('should import models customizing the tablename');
});
