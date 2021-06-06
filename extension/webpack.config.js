const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WextManifestWebpackPlugin = require('wext-manifest-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const nodeEnv = process.env.NODE_ENV || 'development';
const viewsPath = path.join(__dirname, 'views');
const sourcePath = path.join(__dirname, 'src');
const destPath = path.join(__dirname, 'dist');
const targetBrowser = process.env.TARGET_BROWSER;

const getExtensionFileType = (browser) => {
    if (browser === 'opera') {
      return 'crx';
    }
  
    if (browser === 'firefox') {
      return 'xpi';
    }
  
    return 'zip';
};

module.exports = {
    devtool: false,

    mode: nodeEnv,

    entry: {
        manifest: path.join(sourcePath, 'manifest.json'),
        newtab: path.join(sourcePath, 'newtab/index.jsx'),
    },

    output: {
        path: path.join(destPath, targetBrowser),
        filename: 'js/[name].bundle.js',
    },

    resolve: {
        extensions: ['.png', '.js', '.json'],
        alias: {
            react: path.resolve(
            path.join(__dirname, 'node_modules', 'preact', 'compat'),
            ),
            'react-dom': path.resolve(
            path.join(__dirname, 'node_modules', 'preact', 'compat'),
            ),
        },
    },

    
  module: {
        rules: [
            {
                type: 'javascript/auto', // prevent webpack handling json with its own loaders,
                test: /manifest\.json$/,
                use: {
                    loader: 'wext-manifest-loader',
                    options: {
                    usePackageJSONVersion: true, // set to false to not use package.json version for manifest
                    },
                },
                exclude: /node_modules/,
            },
            {
                test: /\.(js|ts)x?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(sa|sc|c)ss$/,
                exclude: /node_modules/,
                use: [
                  {
                    loader: MiniCssExtractPlugin.loader, // It creates a CSS file per JS file which contains CSS
                  },
                  {
                    loader: 'css-loader', // Takes the CSS files and returns the CSS with imports and url(...) for Webpack
                    options: {
                      sourceMap: true,
                    },
                  },
                  {
                    loader: 'postcss-loader',
                  },
                  'resolve-url-loader', // Rewrites relative paths in url() statements
                ],
            },
        ]
    },

    plugins: [
        new WextManifestWebpackPlugin(),
    
        new HtmlWebpackPlugin({
            template: path.join(viewsPath, 'newtab.html'),
            inject: 'body',
            chunks: ['newtab'],
            hash: true,
            filename: 'index.html',
        }),
        // delete previous build files
        new CleanWebpackPlugin({
            cleanOnceBeforeBuildPatterns: [
            path.join(destPath, targetBrowser),
            path.join(
                destPath,
                `${targetBrowser}.${getExtensionFileType(targetBrowser)}`,
            ),
            ],
            cleanStaleWebpackAssets: false,
            verbose: true,
        }),
        new MiniCssExtractPlugin({ filename: 'css/[name].css' }),
        new CopyWebpackPlugin({
            patterns: [{ from: 'public', to: '.' }],
        }),
    ]
}