### Example Express App

This is a quick example setting up serverless-dotenv-plugin with an express app. It includes an env file for development and one for production:

Development
```
> sls deploy
```

Production
```
> NODE_ENV=production sls deploy
```
or
```
> sls deploy --env production
```
or
```
> sls deploy --stage production
```
