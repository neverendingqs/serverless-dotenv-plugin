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

  describe('resolveEnvFileNames()', function () {})

  describe('loadEnv()', function () {})
})
