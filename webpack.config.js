'use strict';

const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const {WebpackManifestPlugin} = require('webpack-manifest-plugin');

module.exports = (env, argv) => {
    const devMode = argv.mode === 'development';

    return {
        // JavaScript
        entry: {
            'app': './assets/js/app.js'
        },
        output: {
            filename: '[name].js',
            // filename: '[name].[contenthash].js',
            // chunkFilename: '[name].[contenthash].js',
            path: path.resolve(__dirname, 'public/build'),
            publicPath: 'app://build/'
        },

        // Sass
        module: {
            rules: [
                // Website
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        MiniCssExtractPlugin.loader, // instead of style-loader
                        'css-loader', // Translates CSS into CommonJS
                        // 'sass-loader' // Compiles Sass to CSS
                        {
                            loader: 'sass-loader',
                            options: {
                                implementation: require('sass'), // Prefer: dart-sass
                                sassOptions: {
                                    fiber: false,
                                }
                            }
                        }
                    ]
                }, {
                    test: /\.(ttf|eot|woff|woff2)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'fonts/' + (devMode ? '[name]_' : '') + '[hash][ext][query]'
                    }
                }, {
                    test: /\.(gif|png|jpe?g|svg)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'images/' + (devMode ? '[name]_' : '') + '[hash][ext][query]'
                    }
                }
            ],
        },
        externals: [
            function ({ context, request }, callback) {
                let IGNORES = [
                    'electron', 'electron-store', 'fs'
                ];

                if (IGNORES.indexOf(request) >= 0) {
                    return callback(null, "require('" + request + "')");
                }

                callback();
            },
        ],
        plugins: [
            new webpack.DefinePlugin({
                PRODUCTION: (argv.mode === 'production')
            }),
            new WebpackManifestPlugin(),
            new CleanWebpackPlugin({
                verbose: false,
                cleanOnceBeforeBuildPatterns: ['**/*', '!manifest.json'],
            }),
            new MiniCssExtractPlugin({
                filename: '[name].css',
                // filename: '[name].[contenthash].css',
                // chunkFilename: '[name].[contenthash].css'
            })
        ],
        optimization: {
            splitChunks: {
                automaticNameDelimiter: '_',
            }
        },
        performance: {
            hints: false
        },
        mode: 'production',
        stats: 'errors-warnings',
        devtool: 'source-map'
    }
};
