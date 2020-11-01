const chai = require('chai')
const proxyquire = require('proxyquire')
const should = chai.should()
const sinon = require('sinon')

chai.use(require('sinon-chai'))

describe('ServerlessPlugin', function () {
  beforeEach(function () {
    this.sandbox = sinon.createSandbox()

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

  describe('getEnvironment()', function () {})

  describe('resolveEnvFileNames()', function () {})

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
      this.resolveEnvFileNames.withArgs(this.env).returns([])

      this.plugin.loadEnv(this.env)

      this.serverless.cli.log.should.have.been.calledWith(
        'DOTENV: Could not find .env file.',
      )
    })

    it('throws an error if no .env files are required but at least one is required', function () {
      this.serverless.service.custom.dotenv.required.file = true
      this.resolveEnvFileNames.withArgs(this.env).returns([])

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

      const files = Object.keys(filesAndEnvVars)

      this.resolveEnvFileNames.withArgs(this.env).returns(files)

      files.forEach((fileName) => {
        this.requireStubs.dotenv.config
          .withArgs({ path: fileName })
          .returns(filesAndEnvVars[fileName])

        this.requireStubs['dotenv-expand']
          .withArgs(filesAndEnvVars[fileName])
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
        .returns(envVars)

      this.requireStubs['dotenv-expand']
        .withArgs(envVars)
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
        .returns(envVars)

      this.requireStubs['dotenv-expand']
        .withArgs(envVars)
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
        .returns(envVars)

      this.requireStubs['dotenv-expand']
        .withArgs(envVars)
        .returns({ parsed: envVars })

      this.plugin.loadEnv(this.env)

      this.serverless.service.provider.environment.should.deep.equal({
        env1: envVars.env1,
        env2: envVars.env2,
      })
    })
  })
})
