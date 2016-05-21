'use strict';

var path = require('path'),
    fs = require('fs'),
    assign = require('object-assign'),
    snakeCase = require('snake-case');

// make a note of the calling file's path, so that we can resolve relative
// paths. this only works if a fresh version of this module is run on every
// require(), so important: we clear the require() cache each time!
var parentModule = module.parent,
    parentFile = parentModule.filename,
    parentDir = path.dirname(parentFile),
    filename = __filename;

// clear the require's cache
delete require.cache[filename];

module.exports = function importSequelizeModels(sequelizeInstance, modelsDir /* : string */, opts) {
  var pathToModels = modelsDir || '.',
      options = opts || {},
      defaults,
      modelsSpace;

  defaults = {
    // enable recursive search of directories (excluding node_modules by default)
    recursive: true,
    associate: true,
    tableNameFormat: 'snakeCase',
    exclude: []
  };

  options = assign({}, defaults, options);

  // resolve the path to an absolute one:
  pathToModels = path.resolve(parentDir, pathToModels);

  modelsSpace = {
    space: {},
    loaded: []
  };

  modelsSpace = readModelDirectory(
    sequelizeInstance,
    pathToModels,
    pathToModels,
    modelsSpace,
    {
      recursive: options.recursive,
      tableNameFormat: options.tableNameFormat,
      exclude: options.exclude
    }
  );

  // if associate option is activated call the associate method in each model
  if (options.associate) {
    modelsSpace.loaded.forEach(function(currentModel) {
      if ('associate' in currentModel && typeof currentModel.associate === 'function') {
        currentModel.associate(modelsSpace.space);
      }
    });
  }

  return modelsSpace.space;
};

function readModelDirectory(sequelize, pathToModels, dir, modelsSpace, opts) {
  var SEPARATOR = '.',
      space = modelsSpace.space,
      loadedModels = modelsSpace.loaded,
      recursive = opts.recursive,
      tableNameFormat = opts.tableNameFormat,
      excludeFiles = opts.exclude;

  fs.readdirSync(dir)
    .filter(function(file) {
      var absolutePathToFile = path.join(dir, file);

      // ignore the caller file
      if (absolutePathToFile === parentFile) {
        return false;
      }

      return true;
    }).forEach(function(file) {
      var absolutePathToFile = path.join(dir, file),
          stat = fs.statSync(absolutePathToFile),
          namespace = getNamespaceFromPath(pathToModels, absolutePathToFile, SEPARATOR),
          namespaceObj = getNamespaceObject(space, namespace, SEPARATOR),
          pureFileName,
          modelName,
          tableName,
          defineCall,
          model;

      if (stat.isDirectory()) {
        // ignore node_modules
        if (file === 'node_modules') {
          return;
        }

        if (!recursive) {
          return;
        }

        namespaceObj[file] = {};
        readModelDirectory(sequelize, pathToModels, absolutePathToFile, modelsSpace, opts);
      } else if (stat.isFile()) {
        // only load js files
        if (path.extname(file) !== '.js') {
          return;
        }

        // ignore excluded files
        if (Array.isArray(excludeFiles) && excludeFiles.indexOf(file) !== -1) {
          return;
        }

        pureFileName = path.basename(absolutePathToFile, '.js');

        if (typeof tableNameFormat === 'function') {
          tableName = tableNameFormat(pureFileName);
        } else if (tableNameFormat === 'snakeCase') {
          tableName = snakeCase(pureFileName);
        } else {
          throw new Error('Invalid tableNameFormat option: ' + tableNameFormat);
        }

        modelName = namespace ? namespace + SEPARATOR + pureFileName : pureFileName;
        defineCall = require(absolutePathToFile); // eslint-disable-line global-require

        // call sequelize.import with a custom function to be able to pass schema's name value
        model = sequelize.import(absolutePathToFile, function(seqInstance, Datatypes) {
          var hasNamespace = (namespace != null && namespace !== '');

          return defineCall(seqInstance, Datatypes, {
            schema: hasNamespace ? namespace : undefined,
            schemaName: namespace,
            modelName: modelName,
            // for now pass the tableName in snake case,
            // when this module is on npm we should create an option
            // to control this behaviour
            tableName: tableName,
            completeTableName: hasNamespace ? namespace + SEPARATOR + tableName : tableName,
            separator: SEPARATOR
          });
        });

        loadedModels.push(model);
        namespaceObj[pureFileName] = model;
      }
    });

  return modelsSpace;
}

function getNamespaceFromPath(pathToModels, pathToEvaluate, separator) {
  var relativePath = path.relative(pathToModels, pathToEvaluate),
      namespace = '',
      dirs;

  if (relativePath) {
    dirs = path.dirname(relativePath);

    if (dirs === '.') {
      namespace = '';
    } else {
      dirs = dirs.split(path.sep);

      dirs.forEach(function(dirName) {
        namespace += dirName + separator;
      });

      // remove last separator
      namespace = namespace.slice(0, -1);
    }
  }

  return namespace;
}

function getNamespaceObject(namespaceContainer, namespace, separator) {
  var namespaceObj = namespaceContainer,
      nameParts;

  if (namespace === '') {
    return namespaceObj;
  }

  nameParts = namespace.split(separator);

  nameParts.forEach(function(namePart) {
    namespaceObj = namespaceObj[namePart];
  });

  return namespaceObj;
}
