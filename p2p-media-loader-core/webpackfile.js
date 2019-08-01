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
