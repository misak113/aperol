module.exports = {
	test: /\.(t|j)sx?$/,
	exclude: /node_modules/,
	loader: 'babel-loader',
	query: {
		presets: ["@babel/preset-env"]
	},
	enforce: "post"
};
