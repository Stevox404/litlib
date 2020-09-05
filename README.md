# litlib
A little library of server utility functions
<sup>***Note: Version 1.3.0 was the last stable release, no changes shall be made aside from bug fixes until version 2. For new developments, please use version >1.3.1-alpha.0*** </sup>


Included utilities:
1. __[ldb](https://github.com/Stevox404/litlib/tree/master/pgdba)__:
Database Wrappers.
    * Db - Wrapper over pg-pool module.

1. __[cipher](https://github.com/Stevox404/litlib/tree/master/cipher)__:
Some crypto functions.
    * encrypt
    * decrypt
    * hashText
    * generateSalt
    * generateKey
    * randomBytes

1. __[mailer](https://github.com/Stevox404/litlib/tree/master/mailer)__:
Mailing Classes.
    * Email - Send emails using nodemailer

1. __[lfs](https://github.com/Stevox404/litlib/tree/master/lfs)__:
Litlib File Systems
    * S3

1. __[utils](https://github.com/Stevox404/litlib/tree/master/utils)__:
Some other utility functions:
    * manageLogs
    * ServerError
    * snakeToCamelCase
    * camelToSnakeCase
    * wrapAsync