# serverless-dotenv-plugin

[![npm version](https://img.shields.io/npm/v/serverless-dotenv-plugin.svg?style=flat)](https://www.npmjs.com/package/serverless-dotenv-plugin)

Preload environment variables into serverless. Use this plugin if you have variables stored in a `.env` file that you want loaded into your serverless yaml config. This will allow you to reference them as `${env:VAR_NAME}` inside your config _and_ it will load them into your lambdas.

### Install and Setup

First, install the plugin:

```bash
> npm i -D serverless-dotenv-plugin
```

Next, add the plugin to your serverless config file:

```bash
service: myService
plugins:
  - serverless-dotenv-plugin
...
```

Now, just like you would using [dotenv](https://www.npmjs.com/package/dotenv) in any other JS application, create your `.env` file in the root of your app:

```bash
DYANMODB_TABLE=myTable
AWS_REGION=us-west-1
AUTH0_CLIENT_ID=abc12345
AUTH0_CLIENT_SECRET=12345xyz
```

### Automatic ENV File Resolution (as of verson 3.0+ Thanks to [@danilofuchs](https://github.com/danilofuchs)!)

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

### Plugin options

> path: path/to/my/.env

The plugin will look for your .env file in the same folder where you run the command using the file resolution rules as described above, but these rules can be overridden by setting the `path` option. This will **disable** automatic env file resolution

> basePath: path/to/my/

The problem with setting the `path` option is that you lose environment resolution on the file names. If you don't need environment resolution, the path option is just fine. If you do, then use the `basePath` option.

> include: ...

All env vars found in your file will be injected into your lambda functions. If you do not want all of them to be injected into your lambda functions, you can whitelist them with the `include` option.

> exclude: ...

(Added Feb 2, 2020 by @smcelhinney)

If you do not want all of them to be injected into your lambda functions, you can blacklist the unnecessary ones with the `exclude` option. Note, this is only available if the `include` option has not been set.

Example:

```bash
custom:
  dotenv:
    exclude:
      - NODE_ENV # E.g for Google Cloud Functions, you cannot pass this env variable.
```

> logging: true|false (default true)

(Added Feb 2, 2020 by @kristopherchun)

By default, there's quite a bit that this plugin logs to the console. You can now quiet this with the new `logging` option. (This defaults to `true` since this was the original behavior)

Complete example:

```bash
custom:
  dotenv:
    path: path/to/my/.env (default ./.env)
    basePath: path/to/ (default ./)
    logging: false
    include:
      - AUTH0_CLIENT_ID
      - AUTH0_CLIENT_SECRET
```

### Usage

Once loaded, you can now access the vars using the standard method for accessing ENV vars in serverless:

```bash
...
provider:
  name: aws
  runtime: nodejs6.10
  stage: ${env:STAGE}
  region: ${env:AWS_REGION}
...
```

### Lambda Environment Variables

Again, remember that when you deploy your service, the plugin will inject these environment vars into any lambda functions you have and will therefore allow you to reference them as `process.env.AUTH0_CLIENT_ID` (Nodejs example).

### Examples

You can find example usage in the `examples` folder.

### Changelog

https://colyn.dev/serverless-dotenv-plugin-changelog/

### Contributing

Because of the highly dependent nature of this plugin (i.e. thousands of developers depend on this to deploy their apps to production) I cannot introduce changes that are backwards incompatible. Any feature requests must first consider this as a blocker. If submitting a PR ensure that the change is developer opt-in only meaning it must guarantee that it will not affect existing workflows, it's only available with an opt-in setting. I appreciate your patience on this. Thanks.

## Contributors

This project exists thanks to all the people who contribute.
<a href="https://github.com/colynb/serverless-dotenv-plugin/graphs/contributors"><img src="https://opencollective.com/serverless-dotenv-plugin/contributors.svg?width=890&button=false" /></a>
