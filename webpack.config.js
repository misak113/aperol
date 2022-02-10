
const webpack = require('webpack');
const parameters = require('./config/parameters');
const jsonLoader = require('./webpack/jsonLoader');
const tsLoader = require('./webpack/tsLoader');
const babelLoader = require('./webpack/babelLoader');

module.exports = {
	mode: parameters.environment === 'production' ? 'production' : 'development',
	entry: [
		'./src/index',
	],
	output: {
		path: parameters.distPath,
		filename: 'es5.js',
		library: '',
		libraryTarget: 'commonjs'
	},
	devtool: 'source-map',
	plugins: [
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': '"' + parameters.environment + '"',
		}),
	],
	resolve: {
		extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.json']
	},
	module: {
		rules: [
			jsonLoader,
			tsLoader,
			babelLoader,
		],
	},
}
