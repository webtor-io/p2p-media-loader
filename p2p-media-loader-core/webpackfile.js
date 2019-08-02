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

            // Remove unused Buffer methods
            {
                test: /\/buffer\/index\.js$/, loader: 'string-replace-loader',
                options: { search: `Buffer\\.prototype\\.(slice|compare|equals|indexOf|lastIndexOf|concat|swap16|swap32|swap64) = function`, replace: `function`, flags: "g" },
            },
            {
                test: /\/buffer\/index\.js$/, loader: 'string-replace-loader',
                options: { search: `Buffer\\.compare = function`, replace: `function`, flags: "g" },
            },
            {
                test: /\/buffer\/index\.js$/, loader: 'string-replace-loader',
                options: { search: `Buffer\\.prototype\\.(writeUInt((?!32BE)\\S)*|writeInt((?!32BE)\\S)*|readInt((?!32BE)\\S)*|readUInt\\S*|(read|write)(Float|Double)\\S*|fill) = `, replace: ``, flags: "g" },
            },

            // Remove unused Readable methods
            {
                test: /\/readable-stream\/lib\/_stream_readable\.js$/, loader: 'string-replace-loader',
                options: { search: `Readable\\.prototype\\.(pipe|unpipe|wrap) = function`, replace: `function ___x`, flags: "g" },
            },

            // Remove unused Peer methods
            {
                test: /\/simple-peer\/index\.js$/, loader: 'string-replace-loader',
                options: { search: `Peer\\.prototype\\.(addTrack|replaceTrack|removeTrack|removeStream) = function`, replace: `function ___x`, flags: "g" },
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
        externals: {
            // Remove unused dependencies
            "string_decoder/": "undefined",
            "./lib/_stream_transform.js": "undefined",
            "./lib/_stream_passthrough.js": "undefined",
            "base64-js": "undefined",
            "ieee754": "undefined",
            "core-util-is": "{}",
        },
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
