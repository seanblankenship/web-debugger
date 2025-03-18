const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
    const isDevelopment = argv.mode === 'development';

    return {
        entry: './src/js/dev-overlay.js',
        output: {
            filename: 'dev-overlay.js',
            path: path.resolve(__dirname, 'dist'),
            clean: true,
        },
        devtool: isDevelopment ? 'source-map' : false,
        devServer: {
            static: './dist',
            hot: true,
            port: 3000,
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env'],
                        },
                    },
                },
                {
                    test: /\.scss$/,
                    use: [
                        isDevelopment
                            ? 'style-loader'
                            : MiniCssExtractPlugin.loader,
                        'css-loader',
                        'sass-loader',
                    ],
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf|svg)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'fonts/[name][ext][query]',
                    },
                },
            ],
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: 'css/[name].css',
            }),
            new HtmlWebpackPlugin({
                template: './src/index.html',
                inject: 'head',
                scriptLoading: 'blocking',
            }),
        ],
    };
};
