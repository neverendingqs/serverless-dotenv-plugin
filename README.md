# serverless-dotenv-plugin

![CI](https://github.com/neverendingqs/serverless-dotenv-plugin/workflows/CI/badge.svg)
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

Again, remember that when you deploy your service, the plugin will inject these environment vars into every lambda functions you have and will therefore allow you to reference them as `process.env.AUTH0_CLIENT_ID` (Nodejs example).


## Plugin options

All options are optional.

```yaml
custom:
  dotenv:
    # default: project root
    path: path/to/my/dotenvfiles

    # if set, ignores `path` option, and only uses the dotenv file at this location
    # basePath: path/to/my/.env

    # default: adds all env variables found in your dotenv file(s)
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
      # default: false
      file: true
```

* path (string)
  * The plugin will look for your .env file in the same folder where you run the command using the file resolution rules as described above, but these rules can be overridden by setting the `path` option.
  * This will **disable** automatic env file resolution.

* basePath (string)
  * The problem with setting the `path` option is that you lose environment resolution on the file names.
  * If you don't need environment resolution, the `path` option is just fine.

* include (list)
  * All env vars found in your file will be injected into your lambda functions.
  * If you do not want all of them to be injected into your lambda functions, you can specify the ones you want with the `include` option.
  * If set to an empty list (`[]`), no env vars will be injected.

* exclude (list)
  * If you do not want all of them to be injected into your lambda functions, you can specify the ones you do not want with the `exclude` option.
  * Note, this is only available if the `include` option has not been set.

* logging: true|false
  * Supresses all logging done by this plugin if no errors are encountered.

* required.file: true|false (default false)
  * By default, this plugin will exit gracefully and allow Serverless to continue even if it couldn't find a .env file to use.
  * Set this to `true` to cause Serverless to halt if it could not find a .env file to use.


## Examples

You can find example usage in the `examples` folder.


## Contributing

Because of the highly dependent nature of this plugin (i.e. thousands of developers depend on this to deploy their apps to production) I cannot introduce changes that are backwards incompatible. Any feature requests must first consider this as a blocker. If submitting a PR ensure that the change is developer opt-in only meaning it must guarantee that it will not affect existing workflows, it's only available with an opt-in setting. I appreciate your patience on this. Thanks.
