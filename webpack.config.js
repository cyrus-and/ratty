const HtmlWebpackPartialsPlugin = require('html-webpack-partials-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const package = require('./package.json');
const webpack = require('webpack');

module.exports = (env) => {
    return {
        entry: {
            index: './src/web/index.js',
            searchWorker: './src/web/searchWorker.js'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    use: [
                        'source-map-loader',
                        'babel-loader'
                    ],
                    enforce: 'pre',
                    exclude: /node_modules/
                },
                {
                    test: /\.scss$/,
                    use: [
                        'style-loader',
                        'css-loader',
                        'sass-loader'
                    ]
                },
                {
                    test: /\.(svg|eot|woff|woff2|ttf)$/,
                    use: [
                        'file-loader'
                    ]
                }
            ]
        },
        resolve: {
            fallback: {
                'assert': require.resolve('assert/'),
                'buffer': require.resolve('buffer'),
                'stream': require.resolve('stream-browserify'),
                'zlib': require.resolve('browserify-zlib')
            }
        },
        plugins: [
            new HtmlWebpackPlugin({
                title: package.name,
                excludeChunks: [
                    'searchWorker'
                ]
            }),
            new HtmlWebpackPartialsPlugin({
                path: './src/web/root.html'
            }),
            new webpack.ProvidePlugin({
                process: 'process/browser',
            }),
            new webpack.DefinePlugin({
                WEBPACK_SERVE: env.WEBPACK_SERVE
            })
        ],
        devtool: 'source-map',
        devServer: {
            static: './dist/',
        },
        performance: {
            hints: false
        }
    }
};
