# serverless-dotenv-plugin [![npm version](https://img.shields.io/npm/v/serverless-dotenv-plugin.svg?style=flat)](https://www.npmjs.com/package/serverless-dotenv-plugin)

[![Donate](https://infrontlabs.com/Donate.612b038d.png)](https://www.paypal.me/ColynBrown?locale.x=en_US)

Preload Environment Variables Into Serverless

Use this plugin if you have variables stored in a `.env` file that you want loaded into your serverless yaml config. This will allow you to reference them as `${env:VAR_NAME}` inside your config _and_ it will load them into your lambdas.

### Install and Setup

First, install the plugin:

```
> npm i -D serverless-dotenv-plugin
```

Next, add the plugin to your serverless config file:

```
service: myService
plugins:
  - serverless-dotenv-plugin
...
```

Now, just like you would using [dotenv](https://www.npmjs.com/package/dotenv) in any other JS application, create your `.env` file in the root of your app:

```
DYANMODB_TABLE=myTable
AWS_REGION=us-west-1
AUTH0_CLIENT_ID=abc12345
AUTH0_CLIENT_SECRET=12345xyz
```

#### Automatic Env file name resolution

By default, the plugin looks for the file: `.env`. In most use cases this is all that is needed. However, there are times where you want different env files based on environment. For instance:

```
.env.development
.env.production
```

When you deploy with `NODE_ENV` set: `NODE_ENV=production sls deploy` the plugin will look for a file named `.env.production`. If it doesn't exist it will default to `.env`. If for some reason you can't set NODE_ENV, you could always just pass it in as an option: `sls deploy --env production`. If `NODE_ENV` or `--env` is not set, it will default to `development`.

| Valid .env file names | Description                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| .env                  | Default file name when no other files are specified or found.                                       |
| .env.development      | If NODE_ENV or --env **is not set**, will try to load `.env.development`. If not found, load `.env` |
| .env.{ENV}            | If NODE_ENV or --env **is set**, will try to load `.env.{env}`. If not found, load `.env`           |

### Plugin options

> path: path/to/my/.env

The plugin will look for your .env file in the same folder where you run the command using the file resolution rules as described above, but these rules can be overridden by setting the `path` option.

> basePath: path/to/my/

The problem with setting the `path` option is that you lose environment resolution on the file names. If you don't need environment resolution, the path option is just fine. If you do, then use the `basePath` option.

> include: ...

All env vars found in your file will be injected into your lambda functions. If you do not want all of them to be injected into your lambda functions, you can whitelist them with the `include` option.

> exclude: ...

(Added Feb 2, 2020 by @smcelhinney)

If you do not want all of them to be injected into your lambda functions, you can blacklist the unnecessary ones with the `exclude` option. Note, this is only available if the `include` option has not been set.

Example:

```
custom:
  dotenv:
    exclude:
      - NODE_ENV # E.g for Google Cloud Functions, you cannot pass this env variable.
```

> logging: true|false (default true)

(Added Feb 2, 2020 by @kristopherchun)

By default, there's quite a bit that this plugin logs to the console. You can now quiet this with the new `logging` option. (This defaults to `true` since this was the original behavior)

Complete example:

```
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

```
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

### Adding Dotenv Plugins and Customization

(Added Feb 3, 2020)

I've updated this plugin to allow you to add your own customizations to the dotenv library itself. For instance, there are several plugins that you can use with dotenv. Out of the box, this plugin already supports `dotenv-expand` but what if you wanted to include some other dotenv plugin such as `dotenv-parse-variables`? You can now do this with the help of a config file. In the root of your project, create this file:

dotenv.config.js

```
const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')

module.exports = function(envFileName) {
  return dotenvExpand(dotenv.config({ path: envFileName })).parsed
}
```

### Examples

You can find example usage in the `examples` folder.
