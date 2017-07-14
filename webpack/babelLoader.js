module.exports = {
	test: /\.(t|j)sx?$/,
	exclude: /node_modules/,
	loader: 'babel-loader',
	query: {
		presets: [require.resolve('babel-preset-es2015')]
	}
};
