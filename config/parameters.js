
const path = require('path');

const environment = process.env.NODE_ENV || 'dev';

const rootPath = path.resolve(__dirname + '/..');
const distPath = rootPath + '/dist';

exports = module.exports = {
	environment,
	distPath,
};
