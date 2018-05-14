'use strict';

const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const chalk = require('chalk');

class ServerlessPlugin {

  /**
   *
   * @param serverless
   * @param options
   */
  constructor(serverless, options) {
    this.serverless = serverless;
    this.env = {};
    this.serverless.service.provider.environment = this.serverless.service.provider.environment || {};

    const config = this.serverless.service.custom['dotenv'];

    if (!!config && !!config['process'] && process && process.env) {
      this.loadEnv(process.env, config['process'], 'Process');
    }

    /**
     * Load to lambda is default
     * We use when there is a config object for lambda, no config at all or the `dotenv` is the config itself
     */
    if (
      !!config['lambda']
      || !config
      || (!config['lambda'] && !config['process'])
    ) {
      const configLambda = !!config['lambda'] ?
        config['lambda'] :
        (!config['lambda'] && !config['process']) ?
          config : {};
      this.loadEnv(this.serverless.service.provider.environment, configLambda, 'Lambda');
    }

  }

  /**
   * Applies the env vars from the given configObject to the given env object
   * @param environmentObject
   * @param configObjects
   * @param envNmae
   * @returns {boolean}
   */
  loadEnv(environmentObject, configObject, envName) {
    try {
      this.serverless.cli.log('DOTENV: Loading environment variables to ' + envName + ':');
      const envPath = !!configObject.path ? configObject.path : './.env';
      this.env = dotenvExpand(dotenv.config({path: envPath})).parsed;
      if (!this.env) {
        throw new this.serverless.classes.Error('[serverless-dotenv-plugin] Could not find file: ' + envPath);
        return false;
      }

      if (configObject.include && configObject.exclude) {
        throw new this.serverless.classes.Error('[serverless-dotenv-plugin] You can\'t use include and exclude at the same time')
      }


      if (!!configObject.include) {
        const include = configObject.include;
        Object.keys(this.env)
          .filter((key) => !include.includes(key))
          .forEach((key) => {
            delete this.env[key]
          })
      }
      else if (!!configObject.exclude) {
        const exclude = configObject.exclude;
        Object.keys(this.env)
          .filter((key) => exclude.includes(key))
          .forEach((key) => {
            delete this.env[key]
          })
      }
;;
      Object.keys(this.env)
        .forEach((key) => {
          this.serverless.cli.log("\t - " + key);
          environmentObject[key] = this.env[key];
        })

    } catch (e) {
      console.error(chalk.red('\n Serverless Plugin Error --------------------------------------\n'));
      console.error(chalk.red('  ' + e.message));
    }

  }
}

module.exports = ServerlessPlugin;
