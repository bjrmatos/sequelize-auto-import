'use strict';

var path = require('path'),
    chai = require('chai'),
    Sequelize = require('sequelize'),
    sequelizeAutoImport = require('../src'),
    expect = chai.expect;

function fixture(fixtureName) {
  return path.join(__dirname, 'fixtures', fixtureName);
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
    var models = sequelizeAutoImport(sequelize, fixture('simpleModels'));

    expect(Object.keys(models)).to.have.lengthOf(Object.keys(sequelize.models).length);
    expect(models).to.have.property('Animal', sequelize.models.Animal);
    expect(models).to.have.property('Contact', sequelize.models.Contact);
    expect(models).to.have.property('Person', sequelize.models.Person);
  });

  it('should import models with namespaces', function() {
    var models = sequelizeAutoImport(sequelize, fixture('namespacedModels')),
        modelsNamespaces = Object.keys(models);

    expect(modelsNamespaces).to.have.lengthOf(2);

    expect(models).to.have.deep.property('base.Animal', sequelize.models['base.Animal']);
    expect(models).to.have.deep.property('base.Contact', sequelize.models['base.Contact']);
    expect(models).to.have.deep.property('accounts.Person', sequelize.models['accounts.Person']);
  });

  it('should import single and namespaced models', function() {
    var models = sequelizeAutoImport(sequelize, fixture('mixedModels')),
        modelsKeys = Object.keys(models),
        accountsKeys = Object.keys(models.accounts),
        baseKeys = Object.keys(models.base);

    expect(modelsKeys).to.have.lengthOf(4);
    expect(accountsKeys).to.have.lengthOf(1);
    expect(baseKeys).to.have.lengthOf(2);

    expect(models).to.have.property('Item', sequelize.models.Item);
    expect(models).to.have.property('Service', sequelize.models.Service);
    expect(models).to.have.deep.property('base.Animal', sequelize.models['base.Animal']);
    expect(models).to.have.deep.property('base.Contact', sequelize.models['base.Contact']);
    expect(models).to.have.deep.property('accounts.Person', sequelize.models['accounts.Person']);
  });

  it('should import models ignoring non js files', function() {
    var models = sequelizeAutoImport(sequelize, fixture('nonJSFiles')),
        modelsKeys = Object.keys(models),
        accountsKeys = Object.keys(models.accounts),
        baseKeys = Object.keys(models.base);

    expect(modelsKeys).to.have.lengthOf(5);
    expect(accountsKeys).to.have.lengthOf(1);
    expect(baseKeys).to.have.lengthOf(2);

    expect(models).to.have.property('Item', sequelize.models.Item);
    expect(models).to.have.property('Person', sequelize.models.Person);
    expect(models).to.have.property('Service', sequelize.models.Service);
    expect(models).to.have.deep.property('base.Animal', sequelize.models['base.Animal']);
    expect(models).to.have.deep.property('base.Contact', sequelize.models['base.Contact']);
    expect(models).to.have.deep.property('accounts.Person', sequelize.models['accounts.Person']);
  });

  it('should import models ignoring node_modules', function() {
    var models = sequelizeAutoImport(sequelize, fixture('ignoreNodeModules')),
        modelsKeys = Object.keys(models),
        accountsKeys = Object.keys(models.accounts),
        baseKeys = Object.keys(models.base);

    expect(modelsKeys).to.have.lengthOf(4);
    expect(accountsKeys).to.have.lengthOf(1);
    expect(baseKeys).to.have.lengthOf(2);

    expect(models).to.have.property('Item', sequelize.models.Item);
    expect(models).to.have.property('Service', sequelize.models.Service);
    expect(models).to.not.have.property('node_modules');
    expect(models).to.have.deep.property('base.Animal', sequelize.models['base.Animal']);
    expect(models).to.have.deep.property('base.Contact', sequelize.models['base.Contact']);
    expect(models).to.have.deep.property('accounts.Person', sequelize.models['accounts.Person']);
  });

  it('should import models excluding some files', function() {
    var models = sequelizeAutoImport(sequelize, fixture('mixedModels'), { exclude: ['Service.js'] }),
        modelsKeys = Object.keys(models),
        accountsKeys = Object.keys(models.accounts),
        baseKeys = Object.keys(models.base);

    expect(modelsKeys).to.have.lengthOf(3);
    expect(accountsKeys).to.have.lengthOf(1);
    expect(baseKeys).to.have.lengthOf(2);

    expect(models).to.have.property('Item', sequelize.models.Item);
    expect(models).to.not.have.property('Service');
    expect(models).to.have.deep.property('base.Animal', sequelize.models['base.Animal']);
    expect(models).to.have.deep.property('base.Contact', sequelize.models['base.Contact']);
    expect(models).to.have.deep.property('accounts.Person', sequelize.models['accounts.Person']);
  });

  it('should import models excluding some files repeated in other levels', function() {
    var models = sequelizeAutoImport(sequelize, fixture('nonJSFiles'), { exclude: ['Person.js'] }),
        modelsKeys = Object.keys(models),
        accountsKeys = Object.keys(models.accounts),
        baseKeys = Object.keys(models.base);

    expect(modelsKeys).to.have.lengthOf(4);
    expect(accountsKeys).to.have.lengthOf(0);
    expect(baseKeys).to.have.lengthOf(2);

    expect(models).to.have.property('Item', sequelize.models.Item);
    expect(models).to.have.property('Service', sequelize.models.Service);
    expect(models).to.not.have.property('Person');
    expect(models).to.have.deep.property('base.Animal', sequelize.models['base.Animal']);
    expect(models).to.have.deep.property('base.Contact', sequelize.models['base.Contact']);
    expect(models).to.not.have.deep.property('accounts.Person');
  });

  it('should import models in one level', function() {
    var models = sequelizeAutoImport(sequelize, fixture('mixedModels'), { recursive: false }),
        modelsKeys = Object.keys(models),
        accountsKeys = models.accounts ? Object.keys(models.accounts) : [],
        baseKeys = models.base ? Object.keys(models.base) : [];

    expect(modelsKeys).to.have.lengthOf(2);
    expect(accountsKeys).to.have.lengthOf(0);
    expect(baseKeys).to.have.lengthOf(0);

    expect(models).to.have.property('Item', sequelize.models.Item);
    expect(models).to.have.property('Service', sequelize.models.Service);
    expect(models).to.not.have.deep.property('base.Animal');
    expect(models).to.not.have.deep.property('base.Contact');
    expect(models).to.not.have.deep.property('accounts.Person');
  });

  it('should import models passing model metadata', function() {
    var models = sequelizeAutoImport(sequelize, fixture('fakeModels')),
        metaFake,
        metaNestedFake;

    expect(Object.keys(models)).to.have.lengthOf(2);

    expect(models).to.have.property('Fake');
    expect(models).to.have.deep.property('base.NestedFake');

    metaFake = models.Fake.getMeta();
    metaNestedFake = models.base.NestedFake.getMeta();

    // meta for single model
    expect(metaFake).to.have.property('schema', undefined);
    expect(metaFake).to.have.property('schemaName', '');
    expect(metaFake).to.have.property('modelName', 'Fake');
    expect(metaFake).to.have.property('tableName', 'fake');
    expect(metaFake).to.have.property('completeTableName', 'fake');
    expect(metaFake).to.have.property('separator', '.');

    // meta for namespaced model
    expect(metaNestedFake).to.have.property('schema', 'base');
    expect(metaNestedFake).to.have.property('schemaName', 'base');
    expect(metaNestedFake).to.have.property('modelName', 'base.NestedFake');
    expect(metaNestedFake).to.have.property('tableName', 'nested_fake');
    expect(metaNestedFake).to.have.property('completeTableName', 'base.nested_fake');
    expect(metaNestedFake).to.have.property('separator', '.');
  });

  it('should import models calling `associate` method', function() {
    var models = sequelizeAutoImport(sequelize, fixture('fakeModels'));

    expect(Object.keys(models)).to.have.lengthOf(2);

    expect(models).to.have.property('Fake');
    expect(models).to.have.deep.property('base.NestedFake');

    expect(models.Fake.isAssociateCalled()).to.be.equal(true);
    expect(models.base.NestedFake.isAssociateCalled()).to.be.equal(true);

    expect(models.Fake.getDBInAssociate()).to.be.equal(models);
    expect(models.base.NestedFake.getDBInAssociate()).to.be.equal(models);
  });

  it('should import models not calling `associate` method when is disabled', function() {
    var models = sequelizeAutoImport(sequelize, fixture('fakeModels'), { associate: false });

    expect(Object.keys(models)).to.have.lengthOf(2);

    expect(models).to.have.property('Fake');
    expect(models).to.have.deep.property('base.NestedFake');

    expect(models.Fake.isAssociateCalled()).to.be.equal(false);
    expect(models.base.NestedFake.isAssociateCalled()).to.be.equal(false);

    expect(models.Fake.getDBInAssociate()).to.be.equal(undefined);
    expect(models.base.NestedFake.getDBInAssociate()).to.be.equal(undefined);
  });

  it('should import models with tablename in snake case by default', function() {
    var models = sequelizeAutoImport(sequelize, fixture('customTableNameModels'));

    expect(Object.keys(models)).to.have.lengthOf(3);

    expect(models).to.have.property('AnimalWithSomething', sequelize.models.AnimalWithSomething);
    expect(models).to.have.property('Contact', sequelize.models.Contact);
    expect(models).to.have.deep.property('base.PersonWithSomething', sequelize.models['base.PersonWithSomething']);

    expect(models.AnimalWithSomething.getTableName()).to.be.equal('animal_with_something');
    expect(models.Contact.getTableName()).to.be.equal('contact');
    expect(models.base.PersonWithSomething.getTableName().tableName).to.be.equal('person_with_something');
  });

  it('should import models customizing the tablename', function() {
    var models = sequelizeAutoImport(sequelize, fixture('customTableNameModels'), {
      tableNameFormat: function(modelName) {
        return modelName.toLowerCase();
      }
    });

    expect(Object.keys(models)).to.have.lengthOf(3);

    expect(models).to.have.property('AnimalWithSomething', sequelize.models.AnimalWithSomething);
    expect(models).to.have.property('Contact', sequelize.models.Contact);
    expect(models).to.have.deep.property('base.PersonWithSomething', sequelize.models['base.PersonWithSomething']);

    expect(models.AnimalWithSomething.getTableName()).to.be.equal('animalwithsomething');
    expect(models.Contact.getTableName()).to.be.equal('contact');
    expect(models.base.PersonWithSomething.getTableName().tableName).to.be.equal('personwithsomething');
  });
});
