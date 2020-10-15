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
      dotenvExpand: this.sandbox.stub(),
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
          dotenv: {},
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

  describe('loadEnv()', function () {})
})
