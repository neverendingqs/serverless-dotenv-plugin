'use strict';
module.exports = class ServerlessEnvVarLogger {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    console.log({ FOO: process.env.FOO });

    this.hooks = {
      'before:package:initialize': () => this.log(),
    };
  }

  log() {
    console.log({ FOO: process.env.FOO });
  }
}
