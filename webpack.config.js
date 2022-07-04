const path = require('path');

module.exports = {
	entry: './src/index.ts',
	module: {
		rules: [
			{
				test: /\.t?j?sx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	externals: {
		lodash: 'commonjs lodash',
		'aws-amplify': 'commonjs aws-amplify',
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},
	output: {
		filename: 'index.js',
		path: __dirname + '/dist',
		library: {
			type: 'commonjs-module',
		},
	},
	devtool: 'source-map',
};
