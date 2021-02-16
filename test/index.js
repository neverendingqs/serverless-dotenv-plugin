process.env.TEST_SLS_DOTENV_PLUGIN_ENV1 = 'env1'

const chai = require('chai')
const proxyquire = require('proxyquire')
const should = chai.should()
const sinon = require('sinon')

chai.use(require('sinon-chai'))

describe('ServerlessPlugin', function () {
  beforeEach(function () {
    this.sandbox = sinon.createSandbox()

    this.dotenvParser = {
      path: 'dotenvParser.js',
      prefix: '/tmp'
    }

    this.requireStubs = {
      chalk: {
        red: this.sandbox.stub(),
      },
      dotenv: {
        config: this.sandbox.stub(),
      },
      'dotenv-expand': this.sandbox.stub(),
      fs: {
        existsSync: this.sandbox.stub(),
      },
      [`${this.dotenvParser.prefix}/${this.dotenvParser.path}`]: this.sandbox.stub()
    }

    this.ServerlessPlugin = proxyquire('../', this.requireStubs)

    this.serverless = {
      cli: {
        log: this.sandbox.stub(),
      },
      service: {
        custom: {
          dotenv: {
            required: {},
          },
        },
        provider: {},
      },
    }
    this.options = {}

    this.plugin = new this.ServerlessPlugin(this.serverless, this.options)
  })

  afterEach(function () {
    this.sandbox.verifyAndRestore()
  })

  describe('constructor()', function () {
    it('does not err out on minimal configuration', function () {
      should.exist(this.plugin)
    })

    it('loads environment variables as expected', function () {
      const env = 'unittests'

      const getEnvironment = this.sandbox.stub(
        this.ServerlessPlugin.prototype,
        'getEnvironment',
      )
      getEnvironment.withArgs(this.options).returns(env)

      const loadEnv = this.sandbox.stub(
        this.ServerlessPlugin.prototype,
        'loadEnv',
      )

      new this.ServerlessPlugin(this.serverless, this.options)

      loadEnv.should.have.been.calledWith(env)
    })
  })

  describe('log()', function () {
    it('logs by default', function () {
      const msg = 'msg'
      this.plugin.log(msg)
      this.serverless.cli.log.should.be.calledWith(msg)
    })

    it('does nothing if logging is disabled', function () {
      const serverless = {
        cli: {
          log: this.sandbox.stub(),
        },
        service: {
          custom: {
            dotenv: {
              logging: false,
            },
          },
          provider: {},
        },
      }

      const plugin = new this.ServerlessPlugin(serverless, this.options)
      plugin.log('msg')

      serverless.cli.log.should.not.be.called
    })
  })

  describe('getEnvironment()', function () {
    it("set to 'development' when no other options are available", function () {
      this.plugin.getEnvironment({}).should.equal('development')
    })

    it('uses option.stage if it is set', function () {
      this.plugin
        .getEnvironment({ stage: 'teststage' })
        .should.equal('teststage')
    })

    it('prefers option.env if it is set', function () {
      this.plugin
        .getEnvironment({ env: 'testenv', stage: 'teststage' })
        .should.equal('testenv')
    })

    it('prefers NODE_ENV if it is set', function () {
      this.sandbox.stub(process, 'env').value({ NODE_ENV: 'TEST_NODE_ENV' })
      this.plugin
        .getEnvironment({ env: 'theenv', stage: 'thestage' })
        .should.equal('TEST_NODE_ENV')
    })
  })

  describe('resolveEnvFileNames()', function () {
    describe('with config.path configured', function () {
      it('returns singleton array if set to a string value', function () {
        const path = '.env.unittest'
        this.serverless.service.custom.dotenv.path = path

        this.plugin.resolveEnvFileNames('env').should.deep.equal([path])
      })

      it('returns config.path as-is if set to an array value', function () {
        const path = ['.env.unittest0', '.env.unittest1']
        this.serverless.service.custom.dotenv.path = path

        this.plugin.resolveEnvFileNames('env').should.deep.equal(path)
      })

      it('logs an error if basePath is also set', function () {
        const path = '.env.unittest'
        this.serverless.service.custom.dotenv.basePath = 'base/path/'
        this.serverless.service.custom.dotenv.path = path

        this.plugin.resolveEnvFileNames('env').should.deep.equal([path])
        this.serverless.cli.log.should.have.been.calledWith(
          sinon.match(/basePath/),
        )
      })
    })

    describe('with default dotenv paths', function () {
      ;['staging', 'production', 'dmz'].forEach((env) => {
        it(`returns all path with any "env" other than "test" (${env})`, function () {
          const expectedDotenvFiles = [
            `.env.${env}.local`,
            `.env.${env}`,
            '.env.local',
            '.env',
          ]

          expectedDotenvFiles.forEach((file) =>
            this.requireStubs.fs.existsSync.withArgs(file).returns(true),
          )

          this.plugin
            .resolveEnvFileNames(env)
            .should.deep.equal(expectedDotenvFiles)
        })

        it('filters out files that do not exist', function () {
          const missingDotEnvFiles = [`.env.${env}`, '.env.local']

          const expectedDotenvFiles = [`.env.${env}.local`, '.env']

          missingDotEnvFiles.forEach((file) =>
            this.requireStubs.fs.existsSync.withArgs(file).returns(false),
          )

          expectedDotenvFiles.forEach((file) =>
            this.requireStubs.fs.existsSync.withArgs(file).returns(true),
          )

          this.plugin
            .resolveEnvFileNames(env)
            .should.deep.equal(expectedDotenvFiles)
        })
      })

      it('excludes local env file if "env" is set to "test"', function () {
        const env = 'test'
        const expectedDotenvFiles = [`.env.${env}.local`, `.env.${env}`, '.env']

        expectedDotenvFiles.forEach((file) =>
          this.requireStubs.fs.existsSync.withArgs(file).returns(true),
        )

        this.plugin
          .resolveEnvFileNames(env)
          .should.deep.equal(expectedDotenvFiles)
      })

      it('uses "basePath" config if set', function () {
        const basePath = 'unittest/'
        this.serverless.service.custom.dotenv.basePath = basePath

        const env = 'unittest'
        const expectedDotenvFiles = [
          `${basePath}.env.${env}.local`,
          `${basePath}.env.${env}`,
          `${basePath}.env.local`,
          `${basePath}.env`,
        ]

        expectedDotenvFiles.forEach((file) =>
          this.requireStubs.fs.existsSync.withArgs(file).returns(true),
        )

        this.plugin
          .resolveEnvFileNames(env)
          .should.deep.equal(expectedDotenvFiles)
      })
    })
  })

  describe('loadEnv()', function () {
    beforeEach(function () {
      this.env = 'unittests'
      this.resolveEnvFileNames = this.sandbox.stub(
        this.plugin,
        'resolveEnvFileNames',
      )
    })

    it('throws an error if resolveEnvFileNames() throws an error', function () {
      const error = new Error('Error in resolveEnvFileNames()')
      this.resolveEnvFileNames.throws(error)

      should.Throw(() => this.plugin.loadEnv(this.env), error)
    })

    it('logs an error if dotenv.config() throws an error', function () {
      const fileName = '.env'
      this.resolveEnvFileNames.withArgs(this.env).returns([fileName])
      const error = new Error('Error while calling dotenv.config()')
      this.requireStubs.dotenv.config.withArgs({ path: fileName }).throws(error)

      this.plugin.loadEnv(this.env)

      this.requireStubs.chalk.red.should.have.been.calledWith(
        '  ' + error.message,
      )
    })

    it('logs an error if dotenvExpand() throws an error', function () {
      const fileName = '.env'
      this.resolveEnvFileNames.withArgs(this.env).returns([fileName])

      const dotenvConfigResponse = {}
      this.requireStubs.dotenv.config
        .withArgs({ path: fileName })
        .returns(dotenvConfigResponse)

      const error = new Error('Error while calling dotenvExpand()')
      this.requireStubs['dotenv-expand']
        .withArgs(dotenvConfigResponse)
        .throws(error)

      this.plugin.loadEnv(this.env)

      this.requireStubs.chalk.red.should.have.been.calledWith(
        '  ' + error.message,
      )
    })

    it('logs an error if no .env files are required and none are found', function () {
      const log = this.sandbox.stub(this.plugin, 'log')
      this.resolveEnvFileNames.withArgs(this.env).returns([])

      this.plugin.loadEnv(this.env)

      log.should.have.been.calledWith('DOTENV: Could not find .env file.')
    })

    it('throws an error if no .env files are required but at least one is required', function () {
      this.serverless.service.custom.dotenv.required.file = true
      this.resolveEnvFileNames.withArgs(this.env).returns([])

      should.Throw(() => this.plugin.loadEnv(this.env))
    })

    it('throws an error if a missing env is not set', function () {
      this.serverless.service.custom.dotenv.required.env = [
        'NOT_IN_ANY_FILE',
        'NOT_IN_ANY_FILE2',
      ]

      const filesAndEnvVars = {
        file1: {
          ENV1: 'env1value',
          ENV2: 'env2overwrittenvalue',
        },
        file2: {
          ENV2: 'env2value',
          ENV3: 'env3value',
        },
      }

      const files = Object.keys(filesAndEnvVars)

      this.resolveEnvFileNames.withArgs(this.env).returns(files)

      files.forEach((fileName) => {
        this.requireStubs.dotenv.config
          .withArgs({ path: fileName })
          .returns({ parsed: filesAndEnvVars[fileName] })

        this.requireStubs['dotenv-expand']
          .withArgs({ parsed: filesAndEnvVars[fileName] })
          .returns({ parsed: filesAndEnvVars[fileName] })
      })

      should.Throw(() => this.plugin.loadEnv(this.env))
    })

    it('loads variables from all files', function () {
      const filesAndEnvVars = {
        file1: {
          env1: 'env1value',
          env2: 'env2overwrittenvalue',
        },
        file2: {
          env2: 'env2value',
          env3: 'env3value',
        },
      }

      this.serverless.service.custom.dotenv.required.env = [
        'env3',
        'TEST_SLS_DOTENV_PLUGIN_ENV1',
      ]

      const files = Object.keys(filesAndEnvVars)

      this.resolveEnvFileNames.withArgs(this.env).returns(files)

      files.forEach((fileName) => {
        this.requireStubs.dotenv.config
          .withArgs({ path: fileName })
          .returns({ parsed: filesAndEnvVars[fileName] })

        this.requireStubs['dotenv-expand']
          .withArgs({ parsed: filesAndEnvVars[fileName] })
          .returns({ parsed: filesAndEnvVars[fileName] })
      })

      this.plugin.loadEnv(this.env)

      const expectedEnvVars = Object.values(filesAndEnvVars).reduce(
        (acc, envVars) => Object.assign(acc, envVars),
        {},
      )

      this.serverless.service.provider.environment.should.deep.equal(
        expectedEnvVars,
      )
    })

    it('removes keys not in config.include', function () {
      const fileName = '.env'
      const envVars = {
        env1: 'env1value',
        env2: 'env2value',
        env3: 'env3value',
      }
      this.serverless.service.custom.dotenv.include = ['env2']

      this.resolveEnvFileNames.withArgs(this.env).returns([fileName])
      this.requireStubs.dotenv.config
        .withArgs({ path: fileName })
        .returns({ parsed: envVars })

      this.requireStubs['dotenv-expand']
        .withArgs({ parsed: envVars })
        .returns({ parsed: envVars })

      this.plugin.loadEnv(this.env)

      this.serverless.service.provider.environment.should.deep.equal({
        env2: envVars.env2,
      })
    })

    it('removes keys in config.exclude', function () {
      const fileName = '.env'
      const envVars = {
        env1: 'env1value',
        env2: 'env2value',
        env3: 'env3value',
      }
      this.serverless.service.custom.dotenv.exclude = ['env2']

      this.resolveEnvFileNames.withArgs(this.env).returns([fileName])
      this.requireStubs.dotenv.config
        .withArgs({ path: fileName })
        .returns({ parsed: envVars })

      this.requireStubs['dotenv-expand']
        .withArgs({ parsed: envVars })
        .returns({ parsed: envVars })

      this.plugin.loadEnv(this.env)

      this.serverless.service.provider.environment.should.deep.equal({
        env1: envVars.env1,
        env3: envVars.env3,
      })
    })

    it('ignores config.exclude if config.include is set', function () {
      const fileName = '.env'
      const envVars = {
        env1: 'env1value',
        env2: 'env2value',
        env3: 'env3value',
      }
      this.serverless.service.custom.dotenv.include = ['env1', 'env2']
      this.serverless.service.custom.dotenv.exclude = ['env2']

      this.resolveEnvFileNames.withArgs(this.env).returns([fileName])
      this.requireStubs.dotenv.config
        .withArgs({ path: fileName })
        .returns({ parsed: envVars })

      this.requireStubs['dotenv-expand']
        .withArgs({ parsed: envVars })
        .returns({ parsed: envVars })

      this.plugin.loadEnv(this.env)

      this.serverless.service.provider.environment.should.deep.equal({
        env1: envVars.env1,
        env2: envVars.env2,
      })

      this.serverless.cli.log.should.have.been.calledWith(
        sinon.match(/exclude/),
      )
    })

    it('does not use `dotenv-expand` when `variableExpansion` is set to `false`', function () {
      const fileName = '.env'
      const envVars = {
        env1: 'env1value',
        env2: 'env2value',
        env3: 'env3value',
      }

      const serverless = {
        cli: {
          log: this.sandbox.stub(),
        },
        service: {
          custom: {
            dotenv: {
              variableExpansion: false,
            },
          },
          provider: {},
        },
      }

      const plugin = new this.ServerlessPlugin(serverless, this.options)

      const resolveEnvFileNames = this.sandbox.stub(
        plugin,
        'resolveEnvFileNames',
      )

      resolveEnvFileNames.withArgs(this.env).returns([fileName])

      this.requireStubs.dotenv.config
        .withArgs({ path: fileName })
        .returns({ parsed: envVars })

      plugin.loadEnv(this.env)

      serverless.service.provider.environment.should.deep.equal({
        env1: envVars.env1,
        env2: envVars.env2,
        env3: envVars.env3,
      })

      this.requireStubs['dotenv-expand'].should.not.have.been.called
    })

    describe('dotenvParser', function() {
      it('throws if custom parser returns undefined', function() {
        const fileName = '.env'

        const serverless = {
          config: {
            servicePath: this.dotenvParser.prefix
          },
          cli: {
            log: this.sandbox.stub(),
          },
          service: {
            custom: {
              dotenv: {
                dotenvParser: this.dotenvParser.path
              }
            },
            provider: {},
          },
        }

        this.requireStubs[`${this.dotenvParser.prefix}/${this.dotenvParser.path}`]
          .withArgs({
            dotenv: this.requireStubs.dotenv,
            paths: [fileName]
          })
          .returns(undefined)

        should.Throw(() => new this.ServerlessPlugin(serverless, this.options))
      })

      it('uses output of custom parser', function() {
        const fileName = '.env'
        const envVars = {
          env1: 'env1value',
          env2: 'env2value',
          env3: 'env3value',
        }

        const serverless = {
          config: {
            servicePath: this.dotenvParser.prefix
          },
          cli: {
            log: this.sandbox.stub(),
          },
          service: {
            custom: {
              dotenv: {
                dotenvParser: this.dotenvParser.path
              }
            },
            provider: {},
          },
        }

        this.requireStubs[`${this.dotenvParser.prefix}/${this.dotenvParser.path}`]
          .withArgs({
            dotenv: this.requireStubs.dotenv,
            paths: [fileName]
          })
          .returns(envVars)

        new this.ServerlessPlugin(serverless, this.options)

        serverless.service.provider.environment.should.deep.equal({
          env1: envVars.env1,
          env2: envVars.env2,
          env3: envVars.env3,
        })
      })
    })

    it('runs with defaults when there are no configs', function () {
      const fileName = '.env'
      const envVars = {
        env1: 'env1value',
        env2: 'env2value',
        env3: 'env3value',
      }

      const serverless = {
        cli: {
          log: this.sandbox.stub(),
        },
        service: {
          custom: {},
          provider: {},
        },
      }

      const plugin = new this.ServerlessPlugin(serverless, this.options)

      const resolveEnvFileNames = this.sandbox.stub(
        plugin,
        'resolveEnvFileNames',
      )

      resolveEnvFileNames.withArgs(this.env).returns([fileName])

      this.requireStubs.dotenv.config
        .withArgs({ path: fileName })
        .returns({ parsed: envVars })

      this.requireStubs['dotenv-expand']
        .withArgs({ parsed: envVars })
        .returns({ parsed: envVars })

      plugin.loadEnv(this.env)

      should.not.exist(this.plugin.dotenvParserPath)

      serverless.service.provider.environment.should.deep.equal({
        env1: envVars.env1,
        env2: envVars.env2,
        env3: envVars.env3,
      })
    })
  })
})
