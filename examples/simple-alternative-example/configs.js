const dotenv = require('dotenv');

module.exports = async ({ options, resolveConfigurationProperty }) => {
  // Load env vars into Serverless environment
  const envVars = dotenv.config({ path: '.env.local' }).parsed;
  return envVars;
};
