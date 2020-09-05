require('dotenv').config();
const ServerError = require('./ServerError');


/**
 * Set whether to display logs printed by the console.
 * Level 1 - Display error only.
 * Level 2 - Display warn and lower.
 * Level 3 - Display info and lower (The default in production env).
 * Level 4 - Display log and lower.
 * Level 5 - Display debug and lower.
 * Level 6 - Display trace and lower (The default in other env).
 * @param {Opts} opts 
 * @typedef Opts
 * @property {1|2|3|4|5|6} level - Verbosity logging level -- env VERBOSITY.
 * @property {string} include - Display regardless of level. Comma separated string.
 * -- env VERBOSITY_INCLUDE
 * @property {string} exclude - Do not display regardless of level. Comma separated string.
 * -- env VERBOSITY_EXCLUDE
 */
function manageLogs(opts) {
    let lvl = 6;
    if (process.env.NODE_ENV === 'production') {
        lvl = 3;
    }

    lvl = process.env.VERBOSITY || lvl;
    const inc = process.env.VERBOSITY_INCLUDE;
    const exc = process.env.VERBOSITY_EXCLUDE;

    opts = opts || {};
    const level = opts.level || lvl;
    const include = opts.include || inc;
    const exclude = opts.exclude || exc;


    const showing = [];
    const shouldShow = {}

    if (level >= 1 || /error/.test(include) && !/error/.test(exclude)) {
        showing.push('errors');
        shouldShow.error = true;
    }
    if (level >= 2 || /warn/.test(include) && !/warn/.test(exclude)) {
        showing.push('warnings');
        shouldShow.warn = true;
    }
    if (level >= 3 || /info/.test(include) && !/info/.test(exclude)) {
        showing.push('info');
        shouldShow.info = true;
    }
    if (level >= 4 || /log/.test(include) && !/log/.test(exclude)) {
        showing.push('logs');
        shouldShow.log = true;
    }
    if (level >= 5 || /debug/.test(include) && !/debug/.test(exclude)) {
        showing.push('debug');
        shouldShow.debug = true;
    }
    if (level >= 6 || /trace/.test(include) && !/trace/.test(exclude)) {
        showing.push('trace');
        shouldShow.trace = true;
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

    const debug = console.debug;
    console.debug = (...msg) => {
        if (shouldShow.debug) {
            debug(...msg);
        }
    }

    const trace = console.trace;
    console.trace = (...msg) => {
        if (shouldShow.trace) {
            trace(...msg);
        }
    }
}


function snakeToCamelCase(val) {
    return changeCase(val);
}
function camelToSnakeCase(val) {
    return changeCase(val, { toSnake: true });
}
function changeCase(val, { toSnake, } = {}) {
    if (!val) return val;
    if (Array.isArray(val)) {
        return val.reduce((acc, elm) => {
            if (!elm) return acc;
            if (typeof elm === 'object') {
                return [...acc, changeCase(elm, { toSnake })]
            }

            return [...acc, elm]
        }, []);
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

/**
 * Handle async express routes
 * @param {import('express').Handler} fn
 * @returns {import('express').Handler} async route handler
 */
function wrapAsync(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(err => {
            next(err);
        });
    }
}


module.exports = {
    manageLogs, ServerError, snakeToCamelCase, camelToSnakeCase,
    wrapAsync
}