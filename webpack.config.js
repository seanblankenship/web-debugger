const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = (env, argv) => {
    const isDevelopment = argv.mode === 'development';

    return {
        mode: isDevelopment ? 'development' : 'production',
        entry: './src/js/dev-overlay.js',
        output: {
            filename: 'js/dev-overlay.js',
            path: path.resolve(__dirname, 'dist'),
            clean: true,
            publicPath: './',
        },
        devtool: isDevelopment ? 'eval-source-map' : 'source-map',
        devServer: {
            static: './dist',
            hot: true,
            open: true,
            port: 8080,
            historyApiFallback: true,
            compress: true,
        },
        optimization: {
            minimize: !isDevelopment,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        format: {
                            comments: false,
                        },
                    },
                    extractComments: false,
                }),
                new CssMinimizerPlugin(),
            ],
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                    },
                },
            },
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
                            cacheDirectory: true,
                        },
                    },
                },
                {
                    test: /\.scss$/,
                    use: [
                        isDevelopment
                            ? 'style-loader'
                            : MiniCssExtractPlugin.loader,
                        {
                            loader: 'css-loader',
                            options: {
                                sourceMap: isDevelopment,
                                importLoaders: 2,
                            },
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                sourceMap: isDevelopment,
                                postcssOptions: {
                                    plugins: ['autoprefixer'],
                                },
                            },
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                sourceMap: isDevelopment,
                            },
                        },
                    ],
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'fonts/[name].[hash][ext]',
                    },
                },
                {
                    test: /\.(png|svg|jpg|jpeg|gif)$/i,
                    type: 'asset/resource',
                    generator: {
                        filename: 'images/[name].[hash][ext]',
                    },
                },
            ],
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: isDevelopment
                    ? 'css/[name].css'
                    : 'css/[name].[contenthash].css',
                chunkFilename: isDevelopment
                    ? 'css/[id].css'
                    : 'css/[id].[contenthash].css',
            }),
            new HtmlWebpackPlugin({
                title: 'Web Debugger',
                template: './src/index.html',
                filename: 'index.html',
                inject: 'head',
                scriptLoading: 'defer',
                meta: {
                    viewport: 'width=device-width, initial-scale=1.0',
                    description:
                        'Web Debugger - Development Tools for Web Applications',
                },
                minify: !isDevelopment && {
                    collapseWhitespace: true,
                    removeComments: true,
                    removeRedundantAttributes: true,
                    removeScriptTypeAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    useShortDoctype: true,
                },
            }),
        ],
        resolve: {
            extensions: ['.js', '.json'],
            alias: {
                '@': path.resolve(__dirname, 'src'),
                '@js': path.resolve(__dirname, 'src/js'),
                '@tools': path.resolve(__dirname, 'src/js/tools'),
                '@modules': path.resolve(__dirname, 'src/js/modules'),
                '@utils': path.resolve(__dirname, 'src/js/utils'),
            },
        },
        performance: {
            hints: isDevelopment ? false : 'warning',
            maxEntrypointSize: 512000,
            maxAssetSize: 512000,
        },
    };
};
