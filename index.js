/**
 * Copyright 2017-present, Mavi, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FanavaGateway
 */

const soap = require('soap');
const moment = require('moment');
const config = require('./config.json');
/**
 * Fanava gateway helper
 */
class FanavaGateway {

    constructor(username, password, mercahantID, redirectURL) {
        this.username = username
        this.password = password
        this.mercahantID = mercahantID
        this.redirectURL = redirectURL
        this.SESSION_ID = null
    }

    /**
     * Initialize the client
     */
    init() {
        const _self = this
        return new Promise((resolve, reject) => {
            soap
                .createClient(config.webservice_url, function (err, client) {
                    if (err) 
                        return reject(_self._processError(err));
                    resolve(client);
                })
        });
    }

    prepareFormHiddenInputs(amount, resNum, options = {}) {
        return `
            <input type='hidden' name="Amount" value="${amount}"/>
            <input type='hidden' name="resNum" value="${resNum}"/>
            <input type='hidden' name="MID" value="${this.mercahantID}"/>
            <input type='hidden' name="‫‪redirectURL‬‬" value="${this.redirectURL}"/>
            ${Object.keys(options).map(key => `<input type="hidden" name="${key}" value="${options[key]}" />`).join('\n')}
        `
    }

    getFormUrl() {
        return config.form_url
    }

    getSimplePaymentForm(amount, resNum, options = {}, message = "در حال انتقال به درگاه...") {
        const hiddenInps = this.prepareFormHiddenInputs(amount, resNum, options)
        const url = this.getFormUrl()
        return `
            <!DOCTYPE html>
            <html>

            <head>
                <meta charset="utf-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>${message}</title>
            </head>

            <body>
                <div style="text-align: center;width: 100%;height: 100%;">
                    <h2>${message}</h2>
                    <form id="form" method="post" action="${url}">
                        ${hiddenInps}
                    </form>
                    <script type="text/javascript">
                        document.getElementById("form").submit()
                    </script>
                </div>
            </body>

            </html>
        `
    }

    login() {
        const _self = this
        return new Promise((resolve, reject) => {
            _self
                .init()
                .then(function (client) {
                    client.login({
                        username: _self.username,
                        password: _self.password
                    }, (err, result) => {
                        if (err) 
                            return reject(_self._processError(err));
                        _self.SESSION_ID = result.return
                        return resolve(client)
                    })
                })
                .catch(function (err) {
                    return reject(_self._processError(err));
                });
        })
    }

    _processError(error) {
        error.message = error
            .message
            .replace('S:Server: ', '')
        return error
    }

    /**
     * Verifies the payment
     */
    verify(refNum, amount) {
        var _self = this;
        return new Promise((resolve, reject) => {
            _self
                .login()
                .then(function (client) {
                    const args = {
                        context: _self.makeContext(),
                        verifyRequest: {
                            refNumList: $refNum
                        }
                    }
                    client.verifyTransaction(args, (err, result) => {
                        if (err) 
                            return reject(this._processError(err))
                        const response = result.return.verifyResponseResults
                        const error = response.verificationError
                        const _amount = response.verificationError.amount
                        const _refNum = response.verificationError.refNum
                        if(refNum == _refNum && amount == amount){
                            resolve({ refNum, amount })
                        }
                        reject({
                            message: error,
                            code: error.message                           
                        })
                    })
                })
                .catch(function (err) {
                    return reject({err: true, reason: err});
                });
        });
    }

    /**
     * Reverse the payment
     */
    reverse(refNum, amount, resNum) {
        var _self = this;
        return new Promise((resolve, reject) => {
            _self
                .login()
                .then(function (client) {})
                .catch(function (err) {
                    return reject(_self._processError(err));
                });
        });
    }

    makeContext() {
        return {
            data: {
                entry: {
                    key: 'SESSION_ID',
                    value: this.SESSION_ID
                }
            }
        }
    }

    logout() {
        var _self = this;
        return new Promise((resolve, reject) => {
            _self
                .login()
                .then(function (client) {
                    const args = {
                        context: _self.makeContext()
                    }
                    client.logout(args, (err, result) => {
                        if (err) 
                            return reject(this._processError(err))
                    })
                })
                .catch(function (err) {
                    return reject({err: true, reason: err});
                });
        });
    }
}
module.exports = FanavaGateway;
