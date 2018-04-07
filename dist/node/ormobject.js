'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// The likelihood to generate a vanity address that is 11 times "Burn" is extremely low:
// - https://en.bitcoin.it/wiki/Vanitygen#Use_of_vanitygen_to_try_to_attack_addresses
var BURN_ADDRESS = 'BurnBurnBurnBurnBurnBurnBurnBurnBurnBurnBurn';

var OrmObject = function () {
    function OrmObject(modelName, modelSchema, connection) {
        var appId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '';
        var transactionList = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];

        _classCallCheck(this, OrmObject);

        this._name = modelName;
        this._schema = modelSchema;
        this._connection = connection;
        this._appId = appId;
        if (transactionList.length) {
            this.transactionHistory = transactionList;
            this.id = transactionList[0].asset.data[this._appId + '-' + this._name].id;
            this.data = _extends.apply(undefined, [{}].concat(_toConsumableArray(transactionList.map(function (tx) {
                return tx.metadata;
            }))));
        }
    }

    _createClass(OrmObject, [{
        key: 'retrieve',
        value: function retrieve(input) {
            var _this = this;

            var query = input || '"' + this._appId + '-' + this._name + '"';
            return this._connection.searchAssets('"' + query + '"').then(function (assets) {
                return Promise.all(assets.map(function (asset) {
                    return _this._connection.getSortedTransactions(asset.id).then(function (txList) {
                        return new OrmObject(_this._name, _this._schema, _this._connection, _this._appId, txList);
                    });
                }));
            });
        }
    }, {
        key: 'create',
        value: function create(inputs) {
            var _this2 = this;

            if (inputs === undefined) {
                console.error('inputs missing');
            }
            var assetPayload = {};
            assetPayload[this._appId + '-' + this._name] = {
                'schema': this._schema,
                'id': 'id:' + this._appId + ':' + (0, _v2.default)()
            };
            return this._connection.createTransaction(inputs.keypair.publicKey, inputs.keypair.privateKey, assetPayload, inputs.data).then(function (tx) {
                return Promise.resolve(_this2._connection.getSortedTransactions(tx.id).then(function (txList) {
                    return new OrmObject(_this2._name, _this2._schema, _this2._connection, _this2._appId, txList);
                }));
            });
        }
    }, {
        key: 'append',
        value: function append(inputs) {
            var _this3 = this;

            if (inputs === undefined) {
                console.error('inputs missing');
            }
            return this._connection.transferTransaction(this.transactionHistory[this.transactionHistory.length - 1], inputs.keypair.publicKey, inputs.keypair.privateKey, inputs.toPublicKey, inputs.data).then(function () {
                return Promise.resolve(_this3._connection.getSortedTransactions(_this3.transactionHistory[0].id).then(function (txList) {
                    return new OrmObject(_this3._name, _this3._schema, _this3._connection, _this3._appId, txList);
                }));
            });
        }
    }, {
        key: 'burn',
        value: function burn(inputs) {
            var _this4 = this;

            if (inputs === undefined) {
                console.error('inputs missing');
            }

            return this._connection.transferTransaction(this.transactionHistory[this.transactionHistory.length - 1], inputs.keypair.publicKey, inputs.keypair.privateKey, BURN_ADDRESS, { status: 'BURNED' }).then(function () {
                return Promise.resolve(_this4._connection.getSortedTransactions(_this4.transactionHistory[0].id).then(function (txList) {
                    return new OrmObject(_this4._name, _this4._schema, _this4._connection, _this4._appId, txList);
                }));
            });
        }
    }]);

    return OrmObject;
}();

exports.default = OrmObject;