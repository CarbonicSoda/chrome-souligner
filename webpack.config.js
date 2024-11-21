"use strict";
//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const PATH_SRC = path.resolve(__dirname, "src");
const PATH_DIST = path.resolve(__dirname, "dist");

/** @type WebpackConfig */
module.exports = {
	// mode: "production",
	//MO DEV
	mode: "none",
	entry: {
		"background/service_worker": path.resolve(PATH_SRC, "background", "service_worker.jsx"),
		"content/content": path.resolve(PATH_SRC, "content", "content.jsx"),
		"popup/popup": path.resolve(PATH_SRC, "popup", "popup.jsx"),
	},
	output: {
		path: PATH_DIST,
		filename: "[name].js",
		clean: true,
	},
	resolve: {
		extensions: [".js", ".jsx", ".css", ".scss"],
	},
	module: {
		rules: [
			{
				test: /\.scss$/,
				use: [
					MiniCssExtractPlugin.loader,
					"css-loader",
					{
						loader: "sass-loader",
						options: {
							sourceMap: true,
							sassOptions: {
								outputStyle: "compressed",
							},
						},
					},
				],
			},
			{
				test: /\.jsx$/,
				exclude: /node_modules/,
				loader: "babel-loader",
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			filename: "popup/popup.html",
			template: "src/popup/popup.html",
			chunks: ["popup"],
		}),
		new MiniCssExtractPlugin({
			filename: "[name].css",
			chunkFilename: "[id].css",
		}),
	],
	// optimization: {
	// minimize: true,
	// 	minimizer: [new TerserPlugin()],
	// },
};
