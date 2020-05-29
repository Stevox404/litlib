require('dotenv').config();

function ServerError(msg, { status, text } = {}) {
    if (msg.status && !(/error/i.test(msg.name))) {
        status = msg.status;
        text = msg.text;
        msg = undefined;
    }

    this.name = 'ServerError';
    this.message = msg || text || '';
    this.status = status || 500;
    this.text = text;
    this.stack = `Error\n`;
}
ServerError.prototype = Error.prototype;



let loggingManaged = false;
function manageLogs() {
    if (loggingManaged) return;

    loggingManaged = true;
    const VERBOSITY = process.env.VERBOSITY;
    const VERBOSITY_TEXT = process.env.VERBOSITY_TEXT;

    const showing = [];
    const shouldShow = {}

    if (VERBOSITY >= 1 || /error/.test(VERBOSITY_TEXT)) {
        showing.push('errors');
        shouldShow.error = true;
    }
    if (VERBOSITY >= 2 || /warn/.test(VERBOSITY_TEXT)) {
        showing.push('warnings');
        shouldShow.warn = true;
    }
    if (VERBOSITY >= 3 || /info/.test(VERBOSITY_TEXT)) {
        showing.push('info');
        shouldShow.info = true;
    }
    if (VERBOSITY >= 4 || /log/.test(VERBOSITY_TEXT)) {
        showing.push('logs');
        shouldShow.log = true;
    }
    console.info(`Showing: [${showing.join(' | ')}]`);

    const error = console.error;
    console.error = (...err) => {
        if (shouldShow.error) {
            error(...err);
        }
    }

    const warn = console.warn;
    console.warn = (...msg) => {
        if (shouldShow.warn) {
            warn(...msg);
        }
    }

    const info = console.info;
    console.info = (...msg) => {
        if (shouldShow.info) {
            info(...msg);
        }
    }

    const log = console.log;
    console.log = (...msg) => {
        if (shouldShow.log) {
            log(...msg);
        }
    }
}


function snakeToCamelCase(val) {
    return changeCase(val);
}
function camelToSnakeCase(val) {
    return changeCase(val, { toSnake: true });
}
function changeCase(val, { toSnake, reduceNullArrayElements = true } = {}) {
    if (!val) return val;
    if (Array.isArray(val)) {
        if (reduceNullArrayElements) {
            return val.reduce((acc, elm) => {
                if (!elm) return acc;
                if (typeof elm === 'object') {
                    return [...acc, changeCase(elm, { toSnake })]
                }

                return [...acc, elm]
            }, []);
        } else {
            return val.map(elm => changeCase(elm, { toSnake }));
        }
    }
    if (val.constructor === Object) {
        const newObj = {}
        Object.keys(val).forEach(key => {
            if (typeof val[key] === 'object') {
                return newObj[changeCase(key, { toSnake })] = changeCase(val[key], { toSnake });
            }
            newObj[changeCase(key, { toSnake })] = val[key];
        });
        return newObj;
    }

    if (typeof val === 'string') {
        if (toSnake) {
            return val.replace(/([A-Z])/g, (match, p1) => ('_' + p1.toLowerCase()));
        } else {
            return val.replace(/\_([a-zA-Z0-9])/g, (match, p1) => p1.toUpperCase());
        }
    }

    return val;
}

function wrapAsync(fn) {
    return function (req, res, next) {
        const promise = fn(req, res, next);
        if (!promise || promise.constructor !== Promise) {
            console.warn("Undefined or non-Promise object returned");
            return promise;
        }

        promise.catch(err => {
            if (!err.name || err.name !== 'ServerError') err = new ServerError(err);
            const caller = getCaller();
            err.stack += `    at ${caller}\n`;
            next(err);
        });
    }
}

function getCaller() {
    const ogPrepStack = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) {
        return stack
    }
    const err = new Error();
    const { stack } = err;
    Error.prepareStackTrace = ogPrepStack;
    const currFile = stack[0].getFileName();
    let callerFile;
    for(let i = 0; i < stack.length; i++){
        callerFile = stack[i].getFileName();
        if(callerFile !== currFile){
            break;
        }
    }
    return callerFile;
}


module.exports = {
    manageLogs, ServerError, snakeToCamelCase, camelToSnakeCase,
    wrapAsync
}