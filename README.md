# serverless-dotenv-plugin
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

### Plugin options

By default, the dotenv package will look for your .env file in the same folder where you run the command, but this can be customized. Also, be default, ALL env vars found in your file will be loaded into your lambda functions. This can also be customized.

With the `custom` section in your serverless config, you can set the path to your .env file and you can tell the plugin to only inject whitelisted variables. 
```
custom:
  dotenv:
    path: ../../.env
    include:
      - DYNAMODB_TABLE
      - AWS_REGION
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

Note that when you deploy your service, the plugin with inject these environment vars into any lambda functions you may have.