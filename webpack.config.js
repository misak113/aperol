
const webpack = require('webpack');
const parameters = require('./config/parameters');
const jsonLoader = require('./webpack/jsonLoader');
const tsLoader = require('./webpack/tsLoader');
const babelLoader = require('./webpack/babelLoader');

module.exports = {
	entry: [
		'./src/index',
	],
	output: {
		path: parameters.distPath,
		filename: 'index.js',
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
		extensions: ['', '.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.json']
	},
	module: {
		loaders: [
			jsonLoader,
			tsLoader,
		],
		postLoaders: [
			babelLoader,
		],
	},
}

switch (parameters.environment) {
	case 'production':
		module.exports.plugins.push(new webpack.optimize.UglifyJsPlugin());
		break;
	case 'test':
		break;
	case 'dev':
		break;
	default:
		throw new Error('Unknown environment ' + parameters.environment);
}
