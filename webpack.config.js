const webpack = require('webpack');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const fs = require('fs');

// Cross Env Setting Webpack
const isProd = process.env.NODE_ENV === 'production';

// Production and Development Path
const publicPathDev = '';
const publicPathProd = '';

// Font Path
const fontPathDev = './fonts/';
const fontPathProd = '../fonts/';

// CSS and Js output filename config
const cssDev = 'css/[name].bundle.css';
const cssProd = 'css/[name].[hash:8].bundle.css';
const jsDev = 'js/[name].bundle.js';
const jsProd = 'js/[name].[hash:8].bundle.js';

// Check env if prod run production setting
const publicPathConfig = isProd ? publicPathDev : publicPathProd;
const cssFileNameConfig = isProd ? cssProd : cssDev;
const jsFileNameConfig = isProd ? jsProd : jsDev;
const fontPathConfig = isProd ? fontPathProd : fontPathDev;

// The path(s) that should be cleaned
const pathsToClean = [
    'dist',
];

const extractSass = new ExtractTextPlugin({
    filename: cssFileNameConfig,
    // Development only for inline css for no need cache refresh
    disable: !isProd,
});

// Setup Dynamic Entry point
function getEntries (){
    return fs.readdirSync('./src/js/')
        .filter(
            (file) => file.match(/.*\.js$/)
        )
        .map((file) => {
            return {
                name: file.substring(0, file.length - 3),
                path: './src/js/' + file
            };
        }).reduce((memo, file) => {
            memo[file.name] = file.path;
            return memo;
            /*
                Should output like below example: 
                { index: './src/js/index.js' }
            */
        }, {});
}

const entryPoint = getEntries();

// Dynamic HtmlWebpackPlugin , not include "app"
var entryHtmlPlugins = Object.keys(entryPoint).filter(allKey => allKey != 'app').map(function(entryName) {    
    return new HtmlWebpackPlugin({
        filename: entryName + '.html',
        template: 'src/pug/' + entryName + '.pug',
        chunks: [entryName, 'app']
    });
});
 
module.exports = {
    entry: entryPoint,
    output: {
        path: path.join(__dirname, 'dist'),
        filename: jsFileNameConfig,
        publicPath: publicPathConfig,
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader'
            }
        },
        {
            test: /\.pug$/,
            use: [{
                loader: 'pug-loader',
                query: {
                    // pretty only for dev
                    pretty: !isProd,
                },
            }],
        },
        {
            test: /\.scss$/,
            // Check if production mode run below
            use: isProd ? extractSass.extract({

                use: [{
                    loader: 'css-loader',
                    options: {
                        minimize: false,
                        url: true,
                    },
                },
                {
                    loader: 'sass-loader',
                    options: {
                        sourceMap: true,
                    },
                }
                ],
                fallback: 'style-loader',
                publicPath: '../',

            })
            // else run development mode 
                :
                ['style-loader', 'css-loader', 'sass-loader'],
        },
        {
            test: /\.(gif|png|jpe?g)$/,
            use: [{
                loader: 'file-loader',
                options: {
                    name: '[name]-[hash:8].[ext]',
                    outputPath: 'img/',
                },
            },
            {
                loader: 'image-webpack-loader',
                options: {
                    mozjpeg: {
                        progressive: true,
                        quality: 65,
                    },
                    // Optipng.enabled: false will disable optipng
                    optipng: {
                        enabled: false,
                    },
                    pngquant: {
                        quality: '65-90',
                        speed: 4,
                    },
                    gifsicle: {
                        interlaced: false,
                    },
                    // the webp option will enable WEBP
                    webp: {
                        quality: 75
                    }
                },
            },
            ],
        },
        {
            test: /.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
            use: [{
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                    outputPath: 'fonts/', // Where the fonts will go
                    publicPath: fontPathConfig, // Override the default path
                },
            }],
        },
        ]
    },
    devServer: {
        contentBase: path.join(__dirname, '/dist'),
        publicPath: '/',
        compress: true,
        host: '0.0.0.0',
        port: 9000,
        //mode: 'development',
        stats: 'minimal',
        open: 'Google Chrome',
        // for vagrant fix
        watchOptions: {
            poll: true,
        },
        allowedHosts: [
            'webpack.local'
        ]
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
            Tether: 'tether',
            'window.Tether': 'tether',
            Popper: ['popper.js', 'default'],
            // Comment out if not use
            Alert: 'exports-loader?Alert!bootstrap/js/dist/alert',
            Button: 'exports-loader?Button!bootstrap/js/dist/button',
            Carousel: 'exports-loader?Carousel!bootstrap/js/dist/carousel',
            Collapse: 'exports-loader?Collapse!bootstrap/js/dist/collapse',
            Dropdown: 'exports-loader?Dropdown!bootstrap/js/dist/dropdown',
            Modal: 'exports-loader?Modal!bootstrap/js/dist/modal',
            Popover: 'exports-loader?Popover!bootstrap/js/dist/popover',
            Scrollspy: 'exports-loader?Scrollspy!bootstrap/js/dist/scrollspy',
            Tab: 'exports-loader?Tab!bootstrap/js/dist/tab',
            Tooltip: 'exports-loader?Tooltip!bootstrap/js/dist/tooltip',
            Util: 'exports-loader?Util!bootstrap/js/dist/util',
        }),
        new FaviconsWebpackPlugin({
            // Your source logo
            logo: './src/img/favicon.png',
            // The prefix for all image files (might be a folder or a name)
            prefix: 'img/icons-[hash]/',
            // Emit all stats of the generated icons
            emitStats: false,
            // The name of the json containing all favicon information
            statsFilename: 'iconstats-[hash].json',
            // Generate a cache file with control hashes and
            // don't rebuild the favicons until those hashes change
            persistentCache: true,
            // Inject the html into the html-webpack-plugin
            inject: true,
            background: '#fff',
            // Favicon app title (see https://github.com/haydenbleasel/favicons#usage)
            //title: 'Webpack App',
            icons: {
                android: false,
                appleIcon: false,
                appleStartup: false,
                coast: false,
                favicons: true,
                firefox: false,
                opengraph: false,
                twitter: false,
                yandex: false,
                windows: false
            }
        }),
        new CleanWebpackPlugin(pathsToClean),
        extractSass
    ].concat(entryHtmlPlugins)
};