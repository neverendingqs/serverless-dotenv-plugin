# serverless-dotenv-plugin

[![CI](https://github.com/neverendingqs/serverless-dotenv-plugin/workflows/CI/badge.svg)](https://github.com/neverendingqs/serverless-dotenv-plugin/actions?query=workflow%3ACI+branch%3Amaster)
[![Coverage Status](https://coveralls.io/repos/github/neverendingqs/serverless-dotenv-plugin/badge.svg?branch=master)](https://coveralls.io/github/neverendingqs/serverless-dotenv-plugin?branch=master)
[![npm version](https://img.shields.io/npm/v/serverless-dotenv-plugin.svg?style=flat)](https://www.npmjs.com/package/serverless-dotenv-plugin)

Preload environment variables into serverless. Use this plugin if you have variables stored in a `.env` file that you want loaded into your serverless yaml config. This will allow you to reference them as `${env:VAR_NAME}` inside your config _and_ it will load them into your lambdas.

## Install and Setup

First, install the plugin:

```bash
> npm i -D serverless-dotenv-plugin
```

Next, add the plugin to your serverless config file:

```yaml
service: myService
plugins:
  - serverless-dotenv-plugin
...
```

Now, just like you would using [dotenv](https://www.npmjs.com/package/dotenv) in any other JS application, create your `.env` file in the root of your app:

```bash
DYNAMODB_TABLE=myTable
AWS_REGION=us-west-1
AUTH0_CLIENT_ID=abc12345
AUTH0_CLIENT_SECRET=12345xyz
```

Once loaded, you can now access the vars using the standard method for accessing ENV vars in serverless:

```yaml
...
provider:
  name: aws
  runtime: nodejs6.10
  stage: ${env:STAGE}
  region: ${env:AWS_REGION}
...
```


## Automatic ENV File Resolution

By default, the plugin looks for the file: `.env`. In most use cases this is all that is needed. However, there are times where you want different env files based on environment. For instance:

```bash
.env.development
.env.production
```

When you deploy with `NODE_ENV` set: `NODE_ENV=production sls deploy` the plugin will look for files named `.env`, `.env.production`, `.env.production.local`. If for some reason you can't set NODE_ENV, you could always just pass it in as an option: `sls deploy --env production` or `sls deploy --stage production`. If `NODE_ENV`, `--env` or `--stage` is not set, it will default to `development`.

The precedence between the options is the following:
`NODE_ENV` **>** `--env` **>** `--stage`

The env resolution pattern follows the one used by [Rail's dotenv](https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use) and [create-react-app](https://create-react-app.dev/docs/adding-custom-environment-variables/#what-other-env-files-can-be-used)

| Valid .env file names | Description                                                                          |
| --------------------- | ------------------------------------------------------------------------------------ |
| .env                  | Default file, always included                                                        |
| .env.local            | Included in all environments except test                                             |
| .env.development      | If NODE_ENV or --env or --stage **is not set**, will try to load `.env.development`. |
| .env.{ENV}            | If NODE_ENV or --env or --stage **is set**, will try to load `.env.{env}`.           |
| .env.{ENV}.local      | Every env set up in `.env.{ENV}.local` **will override** other envs                  |

> Note: .env, .env.development, and .env.production files should be included in your repository as they define defaults. .env\*.local should be added to .gitignore, as those files are intended to be ignored. .env.local is where secrets can be stored.


## Lambda Environment Variables

Again, remember that when you deploy your service, the plugin will inject these environment vars into every lambda functions you have and will therefore allow you to reference them as `process.env.AUTH0_CLIENT_ID` (Nodejs example). If this behaviour is not desireable, set `include` to `[]`.


## Plugin options

All options are optional.

```yaml
custom:
  dotenv:
    # default: project root
    path: path/to/my/dotenvfiles

    # if set, ignores `path` option, and only uses the dotenv file at this location
    # basePath: path/to/my/.env

    # if set, uses provided dotenv parser function instead of built-in function
    dotenvParser: dotenv.config.js

    # default: adds all env variables found in your dotenv file(s)
    # this option must be set to `[]` if `provider.environment` is not a literal string
    include:
      - DDB_TABLE
      - S3_BUCKET

    # default: does not exclude any env variables found in your dotenv file(s)
    # does nothing if `include` is set
    exclude:
      - AWS_ACCESS_KEY_ID
      - AWS_SECRET_ACCESS_KEY
      - AWS_SESSION_TOKEN
      - NODE_ENV              # Can not be declared for Google Cloud Functions

    # defaults to `false`
    logging: true

    # default: plugin does not cause an error if any file or env variable is missing
    required:
      # default: []
      env:
        - API_KEY

      # default: false
      file: true

    # default: true
    variableExpansion: false
```

* path (string)
  * The plugin will look for your .env file in the same folder where you run the command using the file resolution rules as described above, but these rules can be overridden by setting the `path` option.
  * This will **disable** automatic env file resolution.

* basePath (string)
  * The problem with setting the `path` option is that you lose environment resolution on the file names.
  * If you don't need environment resolution, the `path` option is just fine.

* dotenvParser (string)
  * Path to a custom dotenv parser, relative to the project root (same level as `serverless.yml`).
  * This parser is called once for each dotenv file found.
  * Parameters passed into the function: `{ dotenv, paths }`.
    * `dotenv`: dotenv library provided for you or you can bring your own
    * `paths`: all the dotenv files discovered by the plugin, ordered by precedence (see `Automatic ENV File Resolution` above for details)
  * This function must return a single object, where each key/value pair represents the env var name and value.
  * By default, this uses the built-in parser, which calls `dotenv` followed by `dotenv-expand`.

* include (list)
  * All env vars found in your file will be injected into your lambda functions.
  * If you do not want all of them to be injected into your lambda functions, you can specify the ones you want with the `include` option.
  * If set to an empty list (`[]`), no env vars will be injected.
  * This option must be set to `[]` if `provider.environment` is not a literal string (see FAQ for details).

* exclude (list)
  * If you do not want all of them to be injected into your lambda functions, you can specify the ones you do not want with the `exclude` option.
  * Note, this is only available if the `include` option has not been set.

* logging: true|false
  * Supresses all logging done by this plugin if no errors are encountered.

* required
  * env: (list)
    * A set of env var that must be set either in the Serverless environment or via a `dotenv` file.
    * Throws an error if a required env var is not found.
    * By default, no env vars are required.
  * file: true|false (default false)
    * By default, this plugin will exit gracefully and allow Serverless to continue even if it couldn't find a .env file to use.
    * Set this to `true` to cause Serverless to halt if it could not find a .env file to use.

* variableExpansion: true|false (default true)
  * By default, variables can reference other variables
    * E.g. `INNER_ENV=innerenv, OUTER_ENV=hi-$INNER_ENV`, would resolve to `INNER_ENV=innerenv, OUTER_ENV=hi-innerenv`
  * Setting this to `false` will disable this feature
    * E.g. `INNER_ENV=innerenv, OUTER_ENV=hi-$INNER_ENV`, would resolve to `INNER_ENV=innerenv, OUTER_ENV=hi-$INNER_ENV`


Example `dotenvParser` file:

```js
// You can bring your own or use the one provided by the plugin
const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')

module.exports = function({ dotenv, paths }) {
  const envVarsArray = [...paths]
    .reverse()
    .map(path => {
      const parsed = dotenv.config({ path })
      return dotenvExpand(parsed).parsed
    })

  return envVarsArray.reduce((acc, curr) => ({ ...acc, ...curr }), {})
}
```

## Examples

You can find example usage in the `examples` folder.


## FAQ

This plugin loads the dotenv environment variables inside the plugin constructor. Aside from legacy reasons, this also means all your dotenv environment variables are available to the other plugins being loaded.

However, Serverless variables are **not** resolved in the constructor:

> Variable references in the serverless instance are not resolved before a Plugin's constructor is called, so if you need these, make sure to wait to access those from your hooks.
> ~https://www.serverless.com/framework/docs/providers/aws/guide/plugins/#plugins/

This is important for several FAQ items below.

### Why doesn't the `basePath` or `path` options support Serverless variables?

Because Serverless variables have not been interpolated when this plugin runs, `basePath` and `path` will always be treated like literal strings (e.g. `${opt:stage}` would be presented to the plugin, not the passed in via `--stage`). The suggested pattern is to store all your dotenv files in one folder, and rely on `NODE_ENV`, `--env`, or `--stage` to resolve to the right file.

There are no plans to support anything other than literal strings at this time, although you are free to discuss this in [#52](https://github.com/neverendingqs/serverless-dotenv-plugin/issues/52).

### Why doesn't this plugin work when `provider.environment` references another file?

This plugin manipuluates `provider.environment` directly by adding to the list. Because Serverless variables have not been interpolated when this plugin runs, `provider.environment` is presented to this plugin uninterpolated (e.g. `${file(./serverless-env.yml):environment}`), this plugin is unable to manipulate it.

To work around this, you can set the `include` option to `[]` to avoid adding any environment variables to `provider.environment`. However, this means you will have to wire up the environment variables yourself by referencing every single one you need. E.g.

```yaml
provider:
  environment:
    - DDB_TABLE: ${env:DDB_TABLE}
```

More details are available at [#38](https://github.com/neverendingqs/serverless-dotenv-plugin/issues/38).

## Contributing

Because of the highly dependent nature of this plugin (i.e. thousands of developers depend on this to deploy their apps to production) I cannot introduce changes that are backwards incompatible. Any feature requests must first consider this as a blocker. If submitting a PR ensure that the change is developer opt-in only meaning it must guarantee that it will not affect existing workflows, it's only available with an opt-in setting. I appreciate your patience on this. Thanks.
