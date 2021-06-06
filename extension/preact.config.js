module.exports = (config, env, helpers, params = defaultParams) => {
    const purgecss = require('@fullhuman/postcss-purgecss')({
      // Specify the paths to all of the template files in your project
      content: ['./src/**/*.js'],
  
      // Include any special characters you're using in this regular expression
      defaultExtractor: content => content.match(params.regex) || [],
    });
  
    const postCssLoaders = helpers.getLoadersByName(config, 'postcss-loader');
    postCssLoaders.forEach(({ loader }) => {
      const plugins = loader.options.plugins;
  
      // Add tailwind css at the top.
      plugins.unshift(require('tailwindcss'));
  
      // Add PurgeCSS only in production.
      if (env.production) {
        plugins.push(purgecss);
      }
    });
    return config;
  };