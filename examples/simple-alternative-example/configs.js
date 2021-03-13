const dotenv = require('dotenv');

module.exports = async ({ options, resolveConfigurationProperty }) => {
  // Load env var into Serverless environment
  const envVars = dotenv.config({ path: '.env.local' }).parsed;
  return envVars;
};
