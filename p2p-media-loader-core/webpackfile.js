const path = require("path");
const webpack = require("webpack");

const OUTPUT_PATH = "build/";

function makeConfig({ libName, minimize, plugins }) {
    return {
        entry: "./lib/browser-init-webpack.js",
        resolve: {
          // Add `.ts` as a resolvable extension.
          extensions: [".ts", ".js"],
        },
        module: {
          rules: [
            // all files with a `.ts` extension will be handled by `ts-loader`
            { test: /\.ts?$/, exclude: [/node_modules/], loader: "ts-loader" },

            // Remove require('url') module because URL object already exists in a browser environment
            {
                test: /\/node_modules\/bittorrent-tracker\/client\.js$/, loader: 'string-replace-loader',
                options: { search: `const URL = require('url').URL`, replace: `` },
            },
            { // TODO: remove once new bittorrent-tracker is released
                test: /\/node_modules\/bittorrent-tracker\/client\.js$/, loader: 'string-replace-loader',
                options: { search: `url.parse(announceUrl)`, replace: `new URL(announceUrl)` },
            },
            { // TODO: remove once new bittorrent-tracker is released
                test: /\/node_modules\/bittorrent-tracker\/client\.js$/, loader: 'string-replace-loader',
                options: { search: `const url = require('url')`, replace: `` },
            },
          ],
        },
        output: {
            filename: OUTPUT_PATH + libName + ".js",
            path: __dirname,
        },
        optimization: {
            minimize: minimize,
        },
        plugins: [...(plugins ? plugins : [])],
    };
}

module.exports = (env, args) => {
    let result;

    if (args.mode === "production") {
        result = [
            makeConfig({
                libName: "p2p-media-loader-core.min",
                plugins: [
                    new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)({
                        analyzerMode: "static",
                        openAnalyzer: false,
                        reportFilename: ".reports/bungle-size.html",
                        generateStatsFile: true,
                        statsFilename: ".reports/bundle-stats.json",
                    })
                ]}),
            makeConfig({
                libName: "p2p-media-loader-core",
                minimize: false,
            }),
        ];
    } else {
        result = makeConfig({ libName: "p2p-media-loader-core.min" });
    }

    return result;
};
