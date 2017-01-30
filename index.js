/* jshint node: true */
'use strict';

var path = require('path');
var VersionChecker = require('ember-cli-version-checker');

module.exports = {
  name: 'ember-resolver',

  included: function() {
    this._super.included.apply(this, arguments);

    var checker = new VersionChecker(this);
    var dep = checker.for('ember-cli', 'npm');

    if (dep.lt('2.0.0')) {
      this.monkeyPatchVendorFiles();
    }

    this.app.import('vendor/ember-resolver/legacy-shims.js');
  },

  treeForAddon: function() {
    var Funnel = require('broccoli-funnel');
    var MergeTrees = require('broccoli-merge-trees');
    var Babel = require('broccoli-babel-transpiler');
    var addonTree = this._super.treeForAddon.apply(this, arguments);
    var glimmerResolverSrc = require.resolve('@glimmer/resolver/package');

    var glimmerResolverTree = new Funnel(path.dirname(glimmerResolverSrc), {
      srcDir: 'dist/modules/es2017',
      destDir: '@glimmer/resolver'
    });

    // ember-cli@2.12 includes specific babel options to be used for transpilation
    // if this.options.babel is present, use it
    // otherwise use the default transpilation options from ember-cli < 2.12
    var babelOptions;
    if (this.options && this.options.babel) {
      babelOptions = this.options.babel;
    } else {
      babelOptions = {
        loose: true,
        blacklist: ['es6.modules']
      };
    }

    glimmerResolverTree = new Babel(glimmerResolverTree, babelOptions);

    var modulesGlimmerResolver = new Funnel(glimmerResolverTree, {
      destDir: 'modules'
    });

    return new MergeTrees([addonTree, modulesGlimmerResolver]);
  },


  monkeyPatchVendorFiles: function() {
    var filesToAppend = this.app.legacyFilesToAppend;
    var legacyResolverIndex = filesToAppend.indexOf(this.app.bowerDirectory + '/ember-resolver/dist/modules/ember-resolver.js');

    if (legacyResolverIndex > -1) {
      filesToAppend.splice(legacyResolverIndex, 1);
    }
  }
};
