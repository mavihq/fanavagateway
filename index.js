'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var soap = require('soap');
var moment = require('moment');
var config = require('./config.json');
/**
 * Fanava gateway helper
 */

var FanavaGateway = function () {
    function FanavaGateway(username, password, mercahantID, redirectURL) {
        _classCallCheck(this, FanavaGateway);

        this.username = username;
        this.password = password;
        this.mercahantID = mercahantID;
        this.redirectURL = redirectURL;
        this.SESSION_ID = null;
    }

    /**
     * Initialize the client
     */


    _createClass(FanavaGateway, [{
        key: 'init',
        value: function init() {
            var _self = this;
            return new Promise(function (resolve, reject) {
                soap.createClient(config.webservice_url, function (err, client) {
                    if (err) return reject(_self._processError(err));
                    resolve(client);
                });
            });
        }
    }, {
        key: 'prepareFormHiddenInputs',
        value: function prepareFormHiddenInputs(amount, resNum) {
            var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

            return '\n            <input type=\'hidden\' name="Amount" value="' + amount + '"/>\n            <input type=\'hidden\' name="resNum" value="' + resNum + '"/>\n            <input type=\'hidden\' name="MID" value="' + this.mercahantID + '"/>\n            <input type=\'hidden\' name="‫‪redirectURL‬‬" value="' + this.redirectURL + '"/>\n            ' + Object.keys(options).map(function (key) {
                return '<input type="hidden" name="' + key + '" value="' + options[key] + '" />';
            }).join('\n') + '\n        ';
        }
    }, {
        key: 'getFormUrl',
        value: function getFormUrl() {
            return config.form_url;
        }
    }, {
        key: 'getSimplePaymentForm',
        value: function getSimplePaymentForm(amount, resNum) {
            var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
            var message = arguments.length <= 3 || arguments[3] === undefined ? "در حال انتقال به درگاه..." : arguments[3];

            var hiddenInps = this.prepareFormHiddenInputs(amount, resNum, options);
            var url = this.getFormUrl();
            return '\n            <!DOCTYPE html>\n            <html>\n\n            <head>\n                <meta charset="utf-8">\n                <meta http-equiv="X-UA-Compatible" content="IE=edge">\n                <meta name="viewport" content="width=device-width, initial-scale=1">\n                <title>' + message + '</title>\n            </head>\n\n            <body>\n                <div style="text-align: center;width: 100%;height: 100%;">\n                    <h2>' + message + '</h2>\n                    <form id="form" method="post" action="' + url + '">\n                        ' + hiddenInps + '\n                    </form>\n                    <script type="text/javascript">\n                        document.getElementById("form").submit()\n                    </script>\n                </div>\n            </body>\n\n            </html>\n        ';
        }
    }, {
        key: 'login',
        value: function login() {
            var _self = this;
            return new Promise(function (resolve, reject) {
                _self.init().then(function (client) {
                    client.login({
                        username: _self.username,
                        password: _self.password
                    }, function (err, result) {
                        if (err) return reject(_self._processError(err));
                        _self.SESSION_ID = result.return;
                        return resolve(client);
                    });
                }).catch(function (err) {
                    return reject(_self._processError(err));
                });
            });
        }
    }, {
        key: '_processError',
        value: function _processError(error) {
            error.message = error.message.replace('S:Server: ', '');
            return error;
        }

        /**
         * Verifies the payment
         */

    }, {
        key: 'verify',
        value: function verify(refNum, amount) {
            var _self = this;
            return new Promise(function (resolve, reject) {
                _self.login().then(function (client) {
                    var _this = this;

                    var args = {
                        context: _self.makeContext(),
                        verifyRequest: {
                            refNumList: $refNum
                        }
                    };
                    client.verifyTransaction(args, function (err, result) {
                        if (err) return reject(_this._processError(err));
                        var response = result.return.verifyResponseResults;
                        var error = response.verificationError;
                        var _amount = response.verificationError.amount;
                        var _refNum = response.verificationError.refNum;
                        if (refNum == _refNum && amount == amount) {
                            resolve({ refNum: refNum, amount: amount });
                        }
                        reject({
                            message: error,
                            code: error.message
                        });
                    });
                }).catch(function (err) {
                    return reject({ err: true, reason: err });
                });
            });
        }

        /**
         * Reverse the payment
         */

    }, {
        key: 'reverse',
        value: function reverse(refNum, amount, resNum) {
            var _self = this;
            return new Promise(function (resolve, reject) {
                _self.login().then(function (client) {}).catch(function (err) {
                    return reject(_self._processError(err));
                });
            });
        }
    }, {
        key: 'makeContext',
        value: function makeContext() {
            return {
                data: {
                    entry: {
                        key: 'SESSION_ID',
                        value: this.SESSION_ID
                    }
                }
            };
        }
    }, {
        key: 'logout',
        value: function logout() {
            var _self = this;
            return new Promise(function (resolve, reject) {
                _self.login().then(function (client) {
                    var _this2 = this;

                    var args = {
                        context: _self.makeContext()
                    };
                    client.logout(args, function (err, result) {
                        if (err) return reject(_this2._processError(err));
                    });
                }).catch(function (err) {
                    return reject({ err: true, reason: err });
                });
            });
        }
    }]);

    return FanavaGateway;
}();

module.exports = FanavaGateway;