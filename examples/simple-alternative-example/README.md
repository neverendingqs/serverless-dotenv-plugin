# simple-alternative-example

This is a simple alternative to how you can use `dotenv` with the Serverless Framework.

See the example in action by running the following:

```sh
npm i
npm run sls -- package
```

The logs and `.serverless/cloudformation-template-update-stack.json` show env vars being loaded by
`dotenv` as expected.
