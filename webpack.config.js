const path = require('path');

module.exports.getWebpackConfig = (config, options) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        "markjs": "mark.js/dist/jquery.mark.js"
      },
    }
});
