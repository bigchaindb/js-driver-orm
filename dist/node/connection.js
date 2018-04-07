'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bigchaindbDriver = require('bigchaindb-driver');

var driver = _interopRequireWildcard(_bigchaindbDriver);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// eslint-disable-line import/no-namespace

var Connection = function () {
    function Connection(path) {
        var headers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, Connection);

        this.path = path;
        this.headers = _extends({}, headers);
        this.conn = new driver.Connection(path, headers);
    }

    _createClass(Connection, [{
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
        key: 'listOutputs',
        value: function listOutputs(publicKey, spent) {
            return this.conn.listOutputs(publicKey, spent);
        }
    }, {
        key: 'getBlock',
        value: function getBlock(blockId) {
            return this.conn.getBlock(blockId);
        }
    }, {
        key: 'listBlocks',
        value: function listBlocks(transactionId) {
            var _this = this;

            return this.conn.listBlocks(transactionId).then(function (blockIds) {
                return Promise.all(blockIds.map(function (blockId) {
                    return _this.conn.getBlock(blockId);
                }));
            });
        }
    }, {
        key: 'listVotes',
        value: function listVotes(blockId) {
            return this.conn.listVotes(blockId);
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

                    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
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