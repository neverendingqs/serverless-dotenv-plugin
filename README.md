# serverless-dotenv-plugin [![npm version](https://img.shields.io/npm/v/serverless-dotenv-plugin.svg?style=flat)](https://www.npmjs.com/package/serverless-dotenv-plugin)

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

### Plugin options

By default, the dotenv package will look for your .env file in the same folder where you run the command, but this can be customized by setting the `path` option. Also, be default, ALL env vars found in your file will be injected into your lambda functions. If you do not want all of them to be injected into your lambda functions, you can whitelist them with the `include` option.

```
custom:
  dotenv:
    path: ../../.env
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
  stage: dev
  region: ${env:AWS_REGION}
...
```

### Lambda Environment Variables

Again, remember that when you deploy your service, the plugin with inject these environment vars into any lambda functions you have and will therefore allow you to reference them as `process.env.AUTH0_CLIENT_ID` (Nodejs example).

### Examples

You can find example usage in the `examples` folder.
