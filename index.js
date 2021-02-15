'use strict'

const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')
const chalk = require('chalk')
const fs = require('fs')

const errorTypes = {
  HALT: 'HALT',
}

class ServerlessPlugin {
  constructor(serverless, options) {
    this.serverless = serverless
    this.serverless.service.provider.environment =
      this.serverless.service.provider.environment || {}
    this.config =
      this.serverless.service.custom && this.serverless.service.custom['dotenv']
    this.logging =
      this.config && typeof this.config.logging !== 'undefined'
        ? this.config.logging
        : true
    this.required = (this.config && this.config.required) || {}
    this.variableExpansion = !(
      (this.config && this.config.variableExpansion) === false
    )

    this.loadEnv(this.getEnvironment(options))
  }

  log(...args) {
    if (this.logging) {
      this.serverless.cli.log(...args)
    }
  }

  /**
   * @param {Object} options
   * @returns {string}
   */
  getEnvironment(options) {
    return process.env.NODE_ENV || options.env || options.stage || 'development'
  }

  /**
   * @param {string} env
   * @returns {string[]}
   */
  resolveEnvFileNames(env) {
    const basePath = (this.config && this.config.basePath) || ''

    if (this.config && this.config.path) {
      if (basePath) {
        this.log('WARNING: if "path" is set, "basePath" is ignored.')
      }

      if (Array.isArray(this.config.path)) {
        return this.config.path
      }
      return [this.config.path]
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
    ]

    const filesNames = dotenvFiles.map((file) => basePath + file)

    return filesNames.filter((fileName) => fs.existsSync(fileName))
  }

  /**
   * @param {string[]} envFileNames
   * @returns {Object}
   */
  parseEnvFiles(envFileNames) {
    const envVarsArray = envFileNames.map((fileName) => {
      const parsed = dotenv.config({ path: fileName })
      return this.variableExpansion
        ? dotenvExpand(parsed).parsed
        : parsed.parsed
    })

    const envVars = envVarsArray.reduce(
      (acc, curr) => ({ ...acc, ...curr }),
      {},
    )

    const missingRequiredEnvVars = (this.required.env || []).filter(
      (envVarName) => !envVars[envVarName] && !process.env[envVarName],
    )

    if (missingRequiredEnvVars.length > 0) {
      throw Object.assign(
        new Error(
          `Missing the following required environment variables: ${missingRequiredEnvVars.join(
            ',',
          )}`,
        ),
        { type: errorTypes.HALT },
      )
    }

    return envVars
  }

  /**
   * @param {Object} envVars
   */
  setProviderEnv(envVars) {
    const include = (this.config && this.config.include) || []
    const exclude = (this.config && this.config.exclude) || []

    if (include.length > 0) {
      if (exclude) {
        this.log('WARNING: if "include" is set, "exclude" is ignored.')
      }

      Object.keys(envVars)
        .filter((key) => !include.includes(key))
        .forEach((key) => {
          delete envVars[key]
        })
    } else if (exclude.length > 0) {
      Object.keys(envVars)
        .filter((key) => exclude.includes(key))
        .forEach((key) => {
          delete envVars[key]
        })
    }

    Object.keys(envVars).forEach((key) => {
      this.log('\t - ' + key)
      this.serverless.service.provider.environment[key] = envVars[key]
    })
  }

  /**
   * @param {string[]} envFileNames
   */
  validateEnvFileNames(envFileNames) {
    if (envFileNames.length > 0) {
      this.log(
        'DOTENV: Loading environment variables from ' +
          envFileNames.reverse().join(', ') +
          ':',
      )
    } else {
      const errorMsg = 'DOTENV: Could not find .env file.'
      this.log(errorMsg)

      if (this.required.file === true) {
        throw Object.assign(new Error(errorMsg), { type: errorTypes.HALT })
      }
    }
  }

  /**
   * @param {string} env
   */
  loadEnv(env) {
    const envFileNames = this.resolveEnvFileNames(env)
    try {
      const envVars = this.parseEnvFiles(envFileNames)
      this.setProviderEnv(envVars)
      this.validateEnvFileNames(envFileNames)
    } catch (e) {
      if (e.type === errorTypes.HALT) {
        throw e
      }

      console.error(
        chalk.red(
          '\n Serverless Plugin Error --------------------------------------\n',
        ),
      )
      console.error(chalk.red('  ' + e.message))
    }
  }
}

module.exports = ServerlessPlugin
