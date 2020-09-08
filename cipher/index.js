const crypto = require('crypto');

/**
 * Hash data using sha256 algorithm.
 *
 * @param {string} text - Text to hash
 * @param {string} salt
 * @returns hashed string.
 */
function hashText(text, salt){
    let hash;
    if(salt){
        hash = crypto.createHmac('sha256', salt).update(text)
        .digest('hex');
    } else {
        hash = crypto.createHash('sha256').update(text)
        .digest('hex');
    }
    return hash;
}



/**
 * Generate random salt for key generation
 */
function generateSalt(){
    return crypto.randomBytes(128).toString('base64');
}


/**
 * Generate key for data encryption.
 *
 * @param {string} password
 * @param {string='salt'} salt
 * @param {number=24} length
 */
function generateKey(password, salt='salt', length = 24){
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, length, (err, key) => {
            if(err) return reject(err)
            resolve(key);
        });
    });
}


/**
 * Encrypt Data
 * @param {string} data
 * @param {Buffer} key
 */
function encrypt(data, key){
    // Key length is dependent on the algorithm. In this case for aes192, it is
    // 24 bytes (192 bits).
    const algo = 'aes-192-cbc';

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algo, key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    encrypted = iv.toString('hex') + ':' + encrypted;

    return encrypted;
}

/**
 * Decrypt Data
 *
 * @param {string} data
 * @param {Buffer} key
 */
function decrypt(data, key){
    return new Promise(async (resolve, reject) => {
        const algo = 'aes-192-cbc';
        let dataParts = data.split(':');
    
        const iv = Buffer.from(dataParts.shift(), 'hex');
        const encrypted = dataParts.join(':');
    
        const decipher = crypto.createDecipheriv(algo, key, iv);
    
        let decrypted = '';
        let chunk = '';
        decipher.on('readable', () => {
            while(null !== (chunk = decipher.read())){
                decrypted += chunk.toString('utf8')
            }
        });
        decipher.on('end', () => {
            resolve(decrypted);
        });

        decipher.write(encrypted, 'hex');
        decipher.end();
    });
}

module.exports = { 
    cipher: {
        hashText, generateSalt, generateKey, encrypt, decrypt, 
        randomBytes: crypto.randomBytes
    }
}
