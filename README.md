# serverless-dotenv-plugin [![npm version](https://img.shields.io/npm/v/serverless-dotenv-plugin.svg?style=flat)](https://www.npmjs.com/package/serverless-dotenv-plugin)

Preload Environment Variables Into Serverless

Use this plugin if you have variables stored in a `.env` file that you want loaded into your serverless yaml config. This will allow you to reference them as `${env:VAR_NAME}` inside your config *and* it will load them into your lambdas.

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

#### Defaults
By default, the dotenv package will look for your .env file in the same folder where you run the command, but this can be customized by setting the `path` option. Also, by default, ALL env vars found in your file will be injected into your lambda functions. If you do not want all of them to be injected into your lambda functions, you can whitelist them with the `include` option or blacklist them with the `exclude` option.

#### Customization
You can decide whether to add your ENV vars to your lambda function or just to the serverless process. (Useful if you don't want or can't have your ENV vars injected into your lambda function).
Add the `process` object to your config, to pass the vars to `process.env`. It is possible to use both config objects at the same time, each with individual black or whitelists. For example to use your AWS credentials only in your config file and pass some other to the lambda function.

```
custom:
  dotenv:
    path: ../../.env
    exclude:
      - AUTH0_CLIENT_ID
      - AUTH0_CLIENT_SECRET
```

```
custom:
  dotenv:
    process: true
```

```
custom:
  dotenv:
    process:
        path: ../../.env
        exclude:
          - AUTH0_CLIENT_ID
          - AUTH0_CLIENT_SECRET
          
```

```
    lambda:
        path: ../../.env
            include:
              - AUTH0_CLIENT_ID
              - AUTH0_CLIENT_SECRET
```

The `path` option can also be used in combination with serverless variables.

```
custom:
  dotenv:
    path: .env-${self:provider.stage}
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