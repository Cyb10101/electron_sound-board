const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');

module.exports = (env, argv) => {
    const devMode = argv.mode === 'development';

    return {
        // JavaScript
        entry: {
            'app': './assets/js/app.js',
        },
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'public/build'),
            publicPath: 'app://build/'
        },

        // Sass
        module: {
            rules: [{
                test: /\.s[ac]ss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    // 'style-loader', // Creates `style` nodes from JS strings
                    'css-loader', // Translates CSS into CommonJS
                    'sass-loader' // Compiles Sass to CSS
                ]
            }, {
                test: /\.(ttf|eot|woff|woff2)$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: 'fonts/[name].[ext]',
                    },
                },
            }, {
                test: /\.(gif|png|jpe?g|svg)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        limit: 8000, // Convert images < 8kb to base64 strings
                        name: 'images/[hash]-[name].[ext]'
                    }
                }]
            }],
        },
        externals: [
            (function () {
                let IGNORES = [
                    'electron', 'electron-store', 'fs'
                ];
                return function (context, request, callback) {
                    if (IGNORES.indexOf(request) >= 0) {
                        return callback(null, "require('" + request + "')");
                    }
                    return callback();
                };
            })()
        ],
        plugins: [
            new MiniCssExtractPlugin({
                filename: '[name].css',
            }),
            new FriendlyErrorsWebpackPlugin({
                clearConsole: false
            })
        ],
        performance: {
            hints: false
        },
        stats: 'none',
        devtool: 'source-map'
    }
};
