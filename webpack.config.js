"use strict";
//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

/** @type WebpackConfig */
const config = {
	mode: "none",
	entry: {
		"background/service_worker": path.resolve(__dirname, "src", "background", "service_worker.ts"),
		"content/content_script": path.resolve(__dirname, "src", "content", "content_script.ts"),
		"popup/popup": path.resolve(__dirname, "src", "popup", "popup.ts"),
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "[name].js",
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
	module: {
		rules: [
			{
				test: /\.html$/,
				type: "asset/resource",
			},
			{
				test: /\.css$/,
				use: [MiniCssExtractPlugin.loader, "css-loader"],
			},
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: "ts-loader",
					},
				],
			},
		],
	},
	plugins: [
		new CleanWebpackPlugin(),
		new CopyPlugin({
			patterns: [
				{ from: "**/src/content/*.css", to: "content/[name][ext]" },
				{ from: "**/src/popup/*.html", to: "popup/[name][ext]" },
				{ from: "**/src/popup/*.css", to: "popup/[name][ext]" },
			],
		}),
	],
	// optimization: {
	// 	minimize: true,
	// 	minimizer: [new HtmlMinimizerPlugin(), new CssMinimizerPlugin(), new TerserPlugin()],
	// },
};

module.exports = config;
