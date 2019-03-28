'use strict'

const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')
const chalk = require('chalk')
const fs = require('fs')

class ServerlessPlugin {
  constructor(serverless, options) {
    this.options = options
    this.serverless = serverless
    this.serverless.service.provider.environment =
      this.serverless.service.provider.environment || {}
    this.config =
      this.serverless.service.custom && this.serverless.service.custom['dotenv']

    this.hooks = {
      'before:deploy:initialize': this.beforeInitialize.bind(this),
      'before:deploy:function:initialize': this.beforeInitialize.bind(this),
    }
  }

  beforeInitialize() {
    this.config =
      this.serverless.service.custom && this.serverless.service.custom['dotenv']

    this.loadEnv(this.getEnvironment(this.options))
  }

  getEnvironment(options) {
    if (process.env.NODE_ENV) {
      return process.env.NODE_ENV
    }

    if (options.env) {
      return options.env
    }

    return 'development'
  }

  resolveEnvFileName(env) {
    if (this.config && this.config.path) {
      return this.config.path
    }

    return fs.existsSync('.env.' + env) ? '.env.' + env : '.env'
  }

  loadEnv(env) {
    var envFileName = this.resolveEnvFileName(env)
    let envVars = dotenvExpand(dotenv.config({ path: envFileName })).parsed

    var include = false
    if (this.config && this.config.include) {
      include = this.config.include
    }

    if (envVars) {
      this.serverless.cli.log(
        'DOTENV: Loading environment variables from ' + envFileName + ':'
      )
      if (include) {
        Object.keys(envVars)
          .filter(key => !include.includes(key))
          .forEach(key => {
            delete envVars[key]
          })
      }
      Object.keys(envVars).forEach(key => {
        this.serverless.cli.log('\t - ' + key)
        this.serverless.service.provider.environment[key] = envVars[key]
      })
    } else {
      throw new Error(`DOTENV: Could not find ${envFileName} file.`)
    }
  }
}

module.exports = ServerlessPlugin


