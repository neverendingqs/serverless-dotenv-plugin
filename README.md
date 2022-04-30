# serverless-dotenv-plugin

[![CI](https://github.com/neverendingqs/serverless-dotenv-plugin/workflows/CI/badge.svg)](https://github.com/neverendingqs/serverless-dotenv-plugin/actions?query=workflow%3ACI+branch%3Amaster)
[![Coverage Status](https://coveralls.io/repos/github/neverendingqs/serverless-dotenv-plugin/badge.svg?branch=master)](https://coveralls.io/github/neverendingqs/serverless-dotenv-plugin?branch=master)
[![npm version](https://img.shields.io/npm/v/serverless-dotenv-plugin.svg?style=flat)](https://www.npmjs.com/package/serverless-dotenv-plugin)

Preload function environment variables into Serverless. Use this plugin if you have variables stored in a `.env` file that you want loaded into your functions.

This used to also preload environment variables into your `serverless.yml` config, but no longer does with `serverless>=2.26.0`.
See [this discussion thread](https://github.com/neverendingqs/serverless-dotenv-plugin/discussions/155) or the FAQ below for details on the impact of how environment variables are loaded with `serverless>=2.26.0` and `serverless>=3.0.0`.**

## Do you need this plugin?

Serverless Framework can now natively resolve `${env:xxx}` variables from `.env` files by setting [`useDotenv: true` in the configuration](https://www.serverless.com/framework/docs/environment-variables):

```yaml
useDotenv: true

provider:
  environment:
    FOO: ${env:FOO}
```

For more complex situations, you will need to [wire up `dotenv` yourself](https://github.com/neverendingqs/serverless-dotenv-example).

This plugin is only useful if you want to automatically import **all** variables from `.env` into functions:

```yaml
plugins:
  - serverless-dotenv-plugin

provider:
  environment:
    # With the plugin enabled, all variables in .env are automatically imported
```

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

When deploying, all the variables listed in `.env` will automatically be available in the deployed functions.

## Automatic ENV File Resolution

By default, the plugin looks for the file: `.env`. In most use cases this is all that is needed. However, there are times where you want different env files based on environment. For instance:

```bash
.env.development
.env.production
```

When you deploy with `NODE_ENV` set: `NODE_ENV=production sls deploy` the plugin will look for files named `.env`, `.env.production`, `.env.production.local`. If for some reason you can't set NODE_ENV, you could always just pass it in as an option: `sls deploy --env production` or `sls deploy --stage production`. If `NODE_ENV`, `--env` or `--stage` is not set, it will default to `development`.

**DEPRECATION WARNING**: as of `serverless>=3.0.0`, `--env` will not be supported due to changes to the Serverless Framework.
See FAQ for details.

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

    # defaults to `true`
    logging: false

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
  * Parameters passed into the function: `{ dotenv, paths }`.
    * `dotenv`: dotenv library provided for you or you can bring your own
    * `paths`: all the dotenv files discovered by the plugin, ordered by precedence (see `Automatic ENV File Resolution` above for details)
  * This function must return a single object, where each key/value pair represents the env var name and value.
  * By default, this uses the built-in parser, which calls `dotenv` followed by `dotenv-expand` for each file.

* include (list or `'*'`) (default: `'*'`)
  * All env vars found in your file will be injected into your lambda functions.
  * If you do not want all of them to be injected into your lambda functions, you can specify the ones you want with the `include` option.
  * If set to `'*'`, all env vars in all dotenv files will be injected.
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

* v4BreakingChanges: true|false (default false)
  * Set this to `true` to introduce v3.x.x => v4.x.x breaking changes now

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

## Changelog

The changelog is available in the `CHANGELOG.md` file in the package or [on GitHub](https://github.com/neverendingqs/serverless-dotenv-plugin/blob/master/CHANGELOG.md).

## FAQ

This plugin loads the dotenv environment variables inside the plugin constructor. Aside from legacy reasons, this also means all your dotenv environment variables are available to the other plugins being loaded.

However, Serverless variables are **not** resolved in the constructor:

> Variable references in the serverless instance are not resolved before a Plugin's constructor is called, so if you need these, make sure to wait to access those from your hooks.
> ~https://www.serverless.com/framework/docs/providers/aws/guide/plugins/#plugins/

This is important for several FAQ items below.

### How has changes to the Serverless Framework affected when environment variables are loaded?

#### `serverless>=2.26.0`

[serverless/serverless#8987](https://github.com/serverless/serverless/pull/8987) changed the order of when plugins are initialized in relationship to variable resolution as part of a larger initiative outlined in [serverless/serverless#8364](https://github.com/serverless/serverless/issues/8364). Because of this, any env var references inside JavaScript files will now get evaluated too early in the process.

#### `serverless>=3.0.0`

`env` variables will get resolved before this plugin is initialized. This means `env` variables inside `serverless.yml` can **no longer** rely on this plugin to load them from `dotenv` files. See [serverless/serverless#8364](https://github.com/serverless/serverless/issues/8364) for more details on the changes made to the Serverless Framework variables engine.

The [Serverless Framework has basic `dotenv` support built-in](https://www.serverless.com/framework/docs/environment-variables/). For support with more complicated workflows with `dotenv`, see [`serverless-dotenv-example`](https://github.com/neverendingqs/serverless-dotenv-example) for details.

You can continue to use this plugin to automatically load environment variables into all your functions using `dotenv`.

### How has changes to the Serverless Framework affected configuration options?

See [deprecation code `UNSUPPORTED_CLI_OPTIONS` for more details](https://www.serverless.com/framework/docs/deprecations/#UNSUPPORTED_CLI_OPTIONS).
This was introduced in [serverless/serverless#9171](https://github.com/serverless/serverless/pull/9171).

#### `serverless>=2.32.0`

Using the `--env` CLI option will now result in the following warning:

```
Detected unrecognized CLI options: "--env".
Starting with the next major, Serverless Framework will report them with a thrown error
More Info: https://www.serverless.com/framework/docs/deprecations/#UNSUPPORTED_CLI_OPTIONS
```

#### `serverless>=3.0.0`

Using the `--env` CLI option will now result in the following error:

```
Error:
Detected unrecognized CLI options: "--env".
```

### Why do env vars already defined by the system take higher precedence?

The [Serverless Framework has basic `dotenv` support built-in](https://www.serverless.com/framework/docs/environment-variables/). If you are loading variables from `.env` at the project root, it is possible the Serverless Framework preloads that env var before this plugin does.

As well, because of the variables engine changed in `serverless>=2.26.0` (see above), `env` variables can also be resolved before this plugin runs, which means Serverless could take the values already defined in the system before the plugin loads env vars via `dotenv`.


### Why doesn't the `basePath` or `path` options support Serverless variables?

Because Serverless variables have not been interpolated when this plugin runs, `basePath` and `path` will always be treated like literal strings (e.g. `${opt:stage}` would be presented to the plugin, not the passed in via `--stage`). The suggested pattern is to store all your dotenv files in one folder, and rely on `NODE_ENV`, `--env`, or `--stage` to resolve to the right file.

There are no plans to support anything other than literal strings at this time, although you are free to discuss this in [#52](https://github.com/neverendingqs/serverless-dotenv-plugin/issues/52).

### Why doesn't this plugin work when `provider.environment` references another file?

Upgrade to `serverless>=2.26.0`. The new variables engine introduced in the Serverless Framework in v2.26.0 now resolves `file` variables first before loading initializing any plugins.

Before v2.26.0, Serverless variables do not get interpolated before this plugin gets initialized, causing `provider.environment` to be presented to this plugin uninterpolated (e.g. `${file(./serverless-env.yml):environment}`). Because of this, the plugin tries to append items to a string instead of a list.

To work around this, you can set the `include` option to `[]` to avoid adding any environment variables to `provider.environment`. However, this means you will have to wire up the environment variables yourself by referencing every single one you need. E.g.

```yaml
provider:
  environment:
    - DDB_TABLE: ${env:DDB_TABLE}
```

More details are available at [#38](https://github.com/neverendingqs/serverless-dotenv-plugin/issues/38).

## Contributing

Because of the highly dependent nature of this plugin (i.e. thousands of developers depend on this to deploy their apps to production) I cannot introduce changes that are backwards incompatible. Any feature requests must first consider this as a blocker. If submitting a PR ensure that the change is developer opt-in only meaning it must guarantee that it will not affect existing workflows, it's only available with an opt-in setting. I appreciate your patience on this. Thanks.
