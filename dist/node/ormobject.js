'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _v = require('uuid/v4');

var _v2 = _interopRequireDefault(_v);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// The likelihood to generate a vanity address that is 11 times "Burn" is extremely low:
// - https://en.bitcoin.it/wiki/Vanitygen#Use_of_vanitygen_to_try_to_attack_addresses
var BURN_ADDRESS = 'BurnBurnBurnBurnBurnBurnBurnBurnBurnBurnBurn';

var OrmObject = function () {
    function OrmObject(modelName, modelSchema, connection) {
        var appId = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'global';
        var transactionList = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
        (0, _classCallCheck3.default)(this, OrmObject);

        this._name = modelName;
        this._schema = modelSchema;
        this._connection = connection;
        this._appId = appId;
        if (transactionList.length) {
            this.transactionHistory = transactionList;
            this.id = transactionList[0].asset.data.id;
            this.data = _extends3.default.apply(undefined, [{}].concat((0, _toConsumableArray3.default)(transactionList.map(function (tx) {
                return tx.metadata;
            }))));
        }
    }

    (0, _createClass3.default)(OrmObject, [{
        key: 'retrieve',
        value: function retrieve() {
            var _this = this;

            var input = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

            var query = void 0;
            if (input !== undefined && input !== '') {
                query = '"' + input + '"';
            } else {
                query = '"id:' + this._appId + ':' + this._name + ':"';
            }
            return this._connection.searchAssets(query).then(function (assets) {
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

            var id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : (0, _v2.default)();

            if (inputs === undefined) {
                console.error('inputs missing');
            }
            var assetPayload = {
                'schema': this._schema,
                'id': 'id:' + this._appId + ':' + this._name + ':' + id
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