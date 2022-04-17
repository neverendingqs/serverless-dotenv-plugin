'use strict';

const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const errorTypes = {
  HALT: 'HALT',
};

const logLevels = {
  NOTICE: 'NOTICE',
  WARNING: 'WARNING',
};

class ServerlessPlugin {
  constructor(serverless, options, v3Utils) {
    this.serverless = serverless;
    this.serverless.service.provider.environment =
      this.serverless.service.provider.environment || {};

    this.config = Object.assign(
      {
        exclude: [],
        include: '*',
        logging: true,
        required: {},
        variableExpansion: true,
        v4BreakingChanges: false,
      },
      (this.serverless.service.custom &&
        this.serverless.service.custom['dotenv']) ||
        {},
    );

    if (this.config.dotenvParser) {
      this.config.dotenvParserPath = path.join(
        serverless.config.servicePath,
        this.config.dotenvParser,
      );
    }

    this.v3Utils = v3Utils;
    this.loadEnv(this.getEnvironment(options));
  }

  log(msg, level = logLevels.NOTICE) {
    if (!this.config.logging) {
      return;
    }

    if (!this.v3Utils) {
      this.serverless.cli.log(msg);
      return;
    }

    // Add logging methods as needed
    // https://www.serverless.com/framework/docs/guides/plugins/cli-output#writing-to-the-output
    switch (level) {
      case logLevels.NOTICE:
        this.v3Utils.log.notice(msg);
        break;

      case logLevels.WARNING:
        this.v3Utils.log.warning(msg);
        break;

      default:
        throw new Error(`Unsupported log level '${level}'. Message: '${msg}'`);
    }
  }

  /**
   * @param {Object} options
   * @returns {string}
   */
  getEnvironment(options) {
    return (
      process.env.NODE_ENV || options.env || options.stage || 'development'
    );
  }

  /**
   * @param {string} env
   * @returns {string[]}
   */
  resolveEnvFileNames(env) {
    const basePath = (this.config && this.config.basePath) || '';

    if (this.config && this.config.path) {
      if (basePath) {
        this.log(
          'DOTENV (WARNING): if "path" is set, "basePath" is ignored.',
          logLevels.WARNING,
        );
      }

      if (Array.isArray(this.config.path)) {
        return this.config.path;
      }
      return [this.config.path];
    }

    // https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
    const dotenvFiles = [
      `.env.${env}.local`,
      `.env.${env}`,
      // Don't include `.env.local` for `test` environment
      // since normally you expect tests to produce the same
      // results for everyone
      env !== 'test' && `.env.local`,
      `.env`,
    ];

    const filesNames = dotenvFiles.map((file) => basePath + file);

    return filesNames.filter((fileName) => fs.existsSync(fileName));
  }

  /**
   * @param {string[]} envFileNames
   * @returns {Object}
   */
  callDotenvParser(envFileNames) {
    try {
      return require(this.config.dotenvParserPath)({
        dotenv,
        paths: envFileNames,
      });
    } catch (err) {
      throw Object.assign(err, { type: errorTypes.HALT });
    }
  }

  /**
   * @param {string[]} envFileNames
   * @returns {Object}
   */
  parseEnvFiles(envFileNames) {
    const envVarsArray = envFileNames.map((fileName) => {
      const parsed = dotenv.config({ path: fileName });
      return this.config.variableExpansion
        ? dotenvExpand.expand(parsed).parsed
        : parsed.parsed;
    });

    return envVarsArray.reduce((acc, curr) => ({ ...acc, ...curr }), {});
  }

  /**
   * @param {Object} envVars
   */
  setProviderEnv(envVars) {
    const include = this.config && this.config.include;
    const exclude = (this.config && this.config.exclude) || [];

    if (include !== '*') {
      if (exclude.length > 0) {
        this.log(
          'DOTENV (WARNING): if "include" is set, "exclude" is ignored.',
          logLevels.WARNING,
        );
      }

      Object.keys(envVars)
        .filter((key) => !include.includes(key))
        .forEach((key) => {
          delete envVars[key];
        });
    } else if (exclude.length > 0) {
      Object.keys(envVars)
        .filter((key) => exclude.includes(key))
        .forEach((key) => {
          delete envVars[key];
        });
    }

    Object.keys(envVars).forEach((key) => {
      this.log('\t - ' + key);
      this.serverless.service.provider.environment[key] = envVars[key];
    });
  }

  /**
   * @param {string[]} envFileNames
   */
  validateEnvFileNames(envFileNames) {
    if (envFileNames.length > 0) {
      this.log(
        'DOTENV: Loading environment variables from ' +
          [...envFileNames].reverse().join(', ') +
          ':',
      );
    } else {
      const errorMsg = 'DOTENV: Could not find .env file.';
      this.log(errorMsg);

      if (this.config.required.file === true) {
        throw Object.assign(new Error(errorMsg), { type: errorTypes.HALT });
      }
    }
  }

  /**
   * @param {string[]} envFileNames
   */
  validateEnvVars(envVars) {
    if (!envVars) {
      throw Object.assign(
        new Error(
          'Unexpected env var object (expected an object but is falsy). Did you forget to return an object in your dotenv parser?',
        ),
        { type: errorTypes.HALT },
      );
    }

    const missingRequiredEnvVars = (this.config.required.env || []).filter(
      (envVarName) => !envVars[envVarName] && !process.env[envVarName],
    );

    if (missingRequiredEnvVars.length > 0) {
      throw Object.assign(
        new Error(
          `Missing the following required environment variables: ${missingRequiredEnvVars.join(
            ',',
          )}`,
        ),
        { type: errorTypes.HALT },
      );
    }
  }

  /**
   * @param {string} env
   */
  loadEnv(env) {
    const envFileNames = this.resolveEnvFileNames(env);
    try {
      this.validateEnvFileNames(envFileNames);

      const envVars = this.config.dotenvParserPath
        ? this.callDotenvParser(envFileNames)
        : this.parseEnvFiles(envFileNames);

      this.validateEnvVars(envVars);
      this.setProviderEnv(envVars);
    } catch (e) {
      if (
        e.type === errorTypes.HALT ||
        this.config.v4BreakingChanges === true
      ) {
        throw e;
      }

      console.error(
        chalk.red(
          '\n Serverless Plugin Error --------------------------------------\n',
        ),
      );
      console.error(chalk.red('  ' + e.message));
    }
  }
}

module.exports = ServerlessPlugin;
