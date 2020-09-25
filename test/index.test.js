const { manageLogs } = require("../utils");

process.env.NODE_ENV = 'test';
process.env.VERBOSITY = 0;
process.env.VERBOSITY_INCLUDE = 'debug,info';
before(async () => {
    console.info('Setting up tests');
    manageLogs();
});

