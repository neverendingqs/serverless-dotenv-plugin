const chai = require('chai')
const should = chai.should()
const sinon = require('sinon')

const ServerlessPlugin = require('../')

describe('ServerlessPlugin', function () {
  beforeEach(function () {
    this.sandbox = sinon.createSandbox()

    this.serverless = {
      cli: {
        log: this.sandbox.stub(),
      },
      service: {
        provider: {},
      },
    }
    this.options = {}

    this.plugin = new ServerlessPlugin(this.serverless, this.options)
  })

  afterEach(function () {
    this.sandbox.verifyAndRestore()
  })

  describe('constructor()', function () {
    it('does not err out on minimal configuration', function () {
      should.exist(this.plugin)
    })
  })

  describe('getEnvironment()', function () {})

  describe('resolveEnvFileNames()', function () {})

  describe('loadEnv()', function () {})
})
