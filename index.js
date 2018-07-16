'use strict';

const fs = require('fs');
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const chalk = require('chalk');

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.env = {};
    this.serverless.service.provider.environment = this.serverless.service.provider.environment || {};
    this.hooks = {
      "before:offline:start:init": this.loadEnv.bind(this),
      "before:offline:start": this.loadEnv.bind(this),
      "before:invoke:local:invoke": this.loadEnv.bind(this),
      "before:deploy:resources": this.loadEnv.bind(this),
      "before:deploy:functions": this.loadEnv.bind(this),
      "before:package:initialize": this.loadEnv.bind(this),
    }
  }

  loadEnv() {
    try {
      this.serverless.cli.log('DOTENV: Loading environment variables:');
      var config = this.serverless.service.custom && this.serverless.service.custom['dotenv'];
      var envPath = (config && config.path) || '.env';
      this.env = dotenvExpand(dotenv.config({path: envPath})).parsed;

      var include = false;
      if (config && config.include) {
        include = config.include;
      }
      if (include) {
        Object.keys(this.env)
          .filter((key) => !include.includes(key))
          .forEach((key) => {
            delete this.env[key]
          })
      }
      Object.keys(this.env)
        .forEach((key) => {
          this.serverless.cli.log("\t - " + key);
          this.serverless.service.provider.environment[key] = this.env[key];
        })
    } catch (e) {
        console.error(chalk.red('\n Serverless Plugin Error --------------------------------------\n'))
        console.error(chalk.red('  ' + e.message));
    }

  }

}

module.exports = ServerlessPlugin;
