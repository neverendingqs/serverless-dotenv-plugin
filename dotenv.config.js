const dotenv = require('dotenv')
const dotenvExpand = require('dotenv-expand')

module.exports = function(envFileName) {
  return dotenvExpand(dotenv.config({ path: envFileName })).parsed
}
