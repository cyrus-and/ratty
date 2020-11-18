const HtmlWebpackPartialsPlugin = require('html-webpack-partials-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const package = require('./package.json');

module.exports = {
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
    plugins: [
        new HtmlWebpackPlugin({
            title: package.name,
            excludeChunks: [
                'searchWorker'
            ]
        }),
        new HtmlWebpackPartialsPlugin({
            path: './src/web/root.html'
        })
    ],
    devtool: 'source-map',
    devServer: {
        contentBase: './dist/',
    },
    performance: {
        hints: false
    }
};
