/**
 * @typedef {(message: string, status: number, text: string)} args1
 * @typedef {(status: number, text: string)} args2
 * @typedef {(message: string, {status: number, text: string})} args3
 */

/**
 * An Error Object for the server with the added properties of
 *  status (a HTTP status code) 
 *  and text (a corresponding HTTP status text or custom message)
 * @param  {args1|args2|args3} args - Constructor arguments (message, status, text)
 */
// TODO add err stack
function ServerError(...args) {
    let message, status, text, err;

    const isStatusCode = code => /^\d{3}$/.test(code);
    if (args[0] instanceof Error) {
        err = args[0]
    } else if (isStatusCode(args[0])) {
        status = args[0];
        if (args[1] instanceof Error) {
            err = args[1]
        } else {
            text = args[1];
            err = args[2]
        }
    } else if (typeof args[0] === "object") {
        ({ status, text, err } = args[0]);
    } else {
        message = args[0];
        if (typeof args[1] === "object" && isStatusCode(args[1].status)) {
            ({ status, text, err } = args[1]);
        } else {
            status = args[1];
            text = args[2];
            err = args[3]
        }
    }

    if (!status) {
        status = 500;
    }
    if (!text) {
        text = codes[status] || 'Undefined Error';
    }
    if (!message) {
        message = text;
    }

    this.name = 'ServerError';
    this.message = message;
    this.status = status || 500;
    this.text = text;
    if (err && err instanceof Error) {
        this.stack = err.stack;
        this.message = err.message;
    } else {
        var temp = Error.apply(this, arguments);
        this.stack = temp.stack;
    }
}
ServerError.prototype = Error.prototype;


const codes = {
    "100": "Continue",
    "101": "Switching Protocols",
    "102": "Processing",
    "103": "Early Hints",
    "199": "Unassigned",
    "200": "OK",
    "201": "Created",
    "202": "Accepted",
    "204": "No Content",
    "205": "Reset Content",
    "206": "Partial Content",
    "208": "Already Reported",
    "225": "Unassigned",
    "226": "IM Used",
    "299": "Unassigned",
    "300": "Multiple Choices",
    "301": "Moved Permanently",
    "302": "Found",
    "303": "See Other",
    "304": "Not Modified",
    "305": "Use Proxy",
    "307": "Temporary Redirect",
    "308": "Permanent Redirect",
    "399": "Unassigned",
    "400": "Bad Request",
    "401": "Unauthorized",
    "402": "Payment Required",
    "403": "Forbidden",
    "404": "Not Found",
    "405": "Method Not Allowed",
    "406": "Not Acceptable",
    "407": "Proxy Authentication Required",
    "408": "Request Timeout",
    "409": "Conflict",
    "410": "Gone",
    "411": "Length Required",
    "412": "Precondition Failed",
    "413": "Payload Too Large",
    "414": "URI Too Long",
    "415": "Unsupported Media Type",
    "416": "Range Not Satisfiable",
    "417": "Expectation Failed",
    "420": "Unassigned",
    "421": "Misdirected Request",
    "422": "Unprocessable Entity",
    "423": "Locked",
    "424": "Failed Dependency",
    "425": "Too Early",
    "426": "Upgrade Required",
    "427": "Unassigned",
    "428": "Precondition Required",
    "429": "Too Many Requests",
    "430": "Unassigned",
    "431": "Request Header Fields Too Large",
    "450": "Unassigned",
    "451": "Unavailable For Legal Reasons",
    "499": "Unassigned",
    "500": "Internal Server Error",
    "501": "Not Implemented",
    "502": "Bad Gateway",
    "503": "Service Unavailable",
    "504": "Gateway Timeout",
    "505": "HTTP Version Not Supported",
    "506": "Variant Also Negotiates",
    "507": "Insufficient Storage",
    "508": "Loop Detected",
    "509": "Unassigned",
    "510": "Not Extended",
    "511": "Network Authentication Required",
    "599": "Unassigned"
}




module.exports = ServerError;