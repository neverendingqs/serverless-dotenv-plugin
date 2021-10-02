# Changelog

Only major and minor version changes are included in this file. Changes not
included in this log but can be reviewed on GitHub:

* ["Chore"](https://github.com/neverendingqs/serverless-dotenv-plugin/pulls?q=+is%3Apr+label%3Achore+)
* [Documentation](https://github.com/neverendingqs/serverless-dotenv-plugin/pulls?q=+is%3Apr+label%3Adocumentation)
* [Refactor](https://github.com/neverendingqs/serverless-dotenv-plugin/pulls?q=label%3Arefactor+is%3Apr)

## 4.0.x (Unreleased)

Breaking changes are introduced when going from version 3.x.x to 4.x.x:

* feat: now halts on all errors. ([#139](https://github.com/neverendingqs/serverless-dotenv-plugin/pull/139))
  * Previously, some errors did not cause the plugin to halt, which may silently cause environment variables to not be set.
  * Note: `required.file` continues to default to `false`.
    * This is because your environment variables might not be stored in dotenv files in all environments.
    * Setting `required.file` to `true` will continue to cause the plugin to halt if no dotenv files are found.

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
