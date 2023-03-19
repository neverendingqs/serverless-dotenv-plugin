# Changelog

Only major and minor version changes are included in this file. Changes not
included in this log but can be reviewed on GitHub:

* ["Chore"](https://github.com/neverendingqs/serverless-dotenv-plugin/pulls?q=+is%3Apr+label%3Achore+)
* [Documentation](https://github.com/neverendingqs/serverless-dotenv-plugin/pulls?q=+is%3Apr+label%3Adocumentation)
* [Refactor](https://github.com/neverendingqs/serverless-dotenv-plugin/pulls?q=label%3Arefactor+is%3Apr)

## Unreleased

Breaking changes introduced:

* feat: now halts on all errors. ([#139](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/139))
  * Previously, some errors did not cause the plugin to halt, which may silently cause environment variables to not be set.
  * Note: `required.file` continues to default to `false`.
    * This is because your environment variables might not be stored in dotenv files in all environments.
    * Setting `required.file` to `true` will continue to cause the plugin to halt if no dotenv files are found.

## 6.0.x

* chore: update deps (2023-03-18) ([#237](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/237))
  * The following packages were upgraded to the latest major version, which introduced changes to how `dotenv` files are parsed:
    * `dotenv-expand` (`^8.0.3` to `^10.0.0`)

## 5.0.x

* chore: remove support for Node.js 10 and Node.js 12 ([#236](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/236))
  * Also added support for Node.js 18 and 19 (LTS and Current)

## 4.0.x

* chore: update deps (2022-04-17) ([#195](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/195))
  * The following packages were upgraded to the latest major version, which introduced changes to how `dotenv` files are parsed:
    * `dotenv` (`^10.0.0` to `^16.0.0`)
    * `dotenv-expand` (`^5.1.0` to `^8.0.3`)

## 3.12.x

* feat: Adapt to `serverless@3` logging interface ([#174](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/174))

## 3.11.x

* feat: add support for `serverless@3`. ([#178](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/178))
* docs(README): add details around UNSUPPORTED_CLI_OPTIONS. ([#177](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/177))
* fix: support for `serverless@pre-3`. ([#180](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/180))

## 3.10.x

* chore(package.json): register `serverless` as peer dependency. ([#159](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/159))

## 3.9.x

* feat: support "*" for include config. ([#146](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/146))

## 3.8.1

* fix: undo behaviour around include = []. ([#145](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/145))

## 3.8.0

* feat: adding an option to toggle breaking changes. ([#138](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/138))

## 3.7.x

* fix: only package required files. ([#134](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/134))

## 3.6.x

* feat: adding support for custom dotenv parser. ([#127](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/127))

## 3.5.x

* feat: now logs when incompatible configs are set. ([#124](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/124))

## 3.4.x

* feat: new option to expect specific env vars to be set. ([#118](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/118))

## 3.3.x

* feat: adding variableExpansion option to turn off variable expansion. ([#116](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/116))

## 3.2.x

* refactor: use helper functions to help with readabilty and future changes. ([#112](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/112))
* Significant changes to documentation structure ([#85..#108 labelled `documentation`](https://github.com/neverendingqs/serverless-dotenv-plugin/pulls?q=is%3Apr+label%3Adocumentation+closed%3A2021-02-06..2021-02-07+))

## 3.0.x

* feat: Load `.env.*.local` envs ([#55](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/55)) ([@danilofuchs](https://github.com/danilofuchs))

## Previous Versions

This list is not exhaustive:

* https://colyn.dev/serverless-dotenv-plugin-changelog/
* Added exclude option to custom config; updated documentation ([#36](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/36)) ([@smcelhinney](https://github.com/smcelhinney))
* Added custom dotenv logging config option to disable serverless cli log output ([#37](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/37)) ([@kristopherchun](https://github.com/kristopherchun))
