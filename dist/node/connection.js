'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _bigchaindbDriver = require('bigchaindb-driver');

var driver = _interopRequireWildcard(_bigchaindbDriver);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// eslint-disable-line import/no-namespace

var Connection = function () {
    function Connection(path) {
        var headers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        (0, _classCallCheck3.default)(this, Connection);

        this.path = path;
        this.headers = (0, _extends3.default)({}, headers);
        this.conn = new driver.Connection(path, headers);
    }

    (0, _createClass3.default)(Connection, [{
        key: 'getAssetId',
        value: function getAssetId(tx) {
            // eslint-disable-line class-methods-use-this
            return tx.operation === 'CREATE' ? tx.id : tx.asset.id;
        }
    }, {
        key: 'getTransaction',
        value: function getTransaction(transactionId) {
            return this.conn.getTransaction(transactionId);
        }
    }, {
        key: 'listTransactions',
        value: function listTransactions(assetId, operation) {
            return this.conn.listTransactions(assetId, operation);
        }
    }, {
        key: 'searchAssets',
        value: function searchAssets(text) {
            return this.conn.searchAssets(text);
        }
    }, {
        key: 'createTransaction',
        value: function createTransaction(publicKey, privateKey, payload, metadata) {
            try {
                // Create a transation
                var tx = driver.Transaction.makeCreateTransaction(payload, metadata, [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(publicKey))], publicKey);

                // sign/fulfill the transaction
                var txSigned = driver.Transaction.signTransaction(tx, privateKey);
                return this.conn.postTransactionCommit(txSigned).then(function () {
                    return txSigned;
                });
            } catch (error) {
                return Promise.reject(error);
            }
        }
    }, {
        key: 'transferTransaction',
        value: function transferTransaction(tx, fromPublicKey, fromPrivateKey, toPublicKey, metadata) {
            try {
                var txTransfer = driver.Transaction.makeTransferTransaction([{ 'tx': tx, 'output_index': 0 }], [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(toPublicKey))], metadata);
                var txTransferSigned = driver.Transaction.signTransaction(txTransfer, fromPrivateKey);
                // send it off to BigchainDB
                return this.conn.postTransactionCommit(txTransferSigned).then(function () {
                    return txTransferSigned;
                });
            } catch (error) {
                return Promise.reject(error);
            }
        }
    }, {
        key: 'getSortedTransactions',
        value: function getSortedTransactions(assetId) {
            return this.conn.listTransactions(assetId).then(function (txList) {
                if (txList.length <= 1) {
                    return txList;
                }
                var inputTransactions = [];
                txList.forEach(function (tx) {
                    return tx.inputs.forEach(function (input) {
                        if (input.fulfills) {
                            inputTransactions.push(input.fulfills.transaction_id);
                        }
                    });
                });
                var unspents = txList.filter(function (tx) {
                    return inputTransactions.indexOf(tx.id) === -1;
                });
                if (unspents.length) {
                    var _ret = function () {
                        var tipTransaction = unspents[0];
                        var tipTransactionId = tipTransaction.inputs[0].fulfills.transaction_id;
                        var sortedTxList = [];
                        while (true) {
                            // eslint-disable-line no-constant-condition
                            sortedTxList.push(tipTransaction);
                            try {
                                tipTransactionId = tipTransaction.inputs[0].fulfills.transaction_id;
                            } catch (e) {
                                break;
                            }
                            if (!tipTransactionId) {
                                break;
                            }
                            tipTransaction = txList.filter(function (tx) {
                                return (// eslint-disable-line no-loop-func, prefer-destructuring
                                    tx.id === tipTransactionId
                                );
                            })[0];
                        }
                        return {
                            v: sortedTxList.reverse()
                        };
                    }();

                    if ((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object") return _ret.v;
                } else {
                    console.error('something went wrong while sorting transactions', txList, inputTransactions);
                }
                return txList;
            });
        }
    }]);
    return Connection;
}();

exports.default = Connection;