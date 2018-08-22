'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _bigchaindbDriver = require('bigchaindb-driver');

var driver = _interopRequireWildcard(_bigchaindbDriver);

var _connection = require('./connection');

var _connection2 = _interopRequireDefault(_connection);

var _ormobject = require('./ormobject');

var _ormobject2 = _interopRequireDefault(_ormobject);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Orm = function () {
    function Orm(connectionUrl, headers) {
        (0, _classCallCheck3.default)(this, Orm);

        this.connection = new _connection2.default(connectionUrl, headers);
        if (headers && headers.app_id !== undefined && headers.app_id !== '') {
            this.appId = headers.app_id;
        } else {
            this.appId = 'global';
        }
        this.models = [];
        this.driver = driver;
    }

    (0, _createClass3.default)(Orm, [{
        key: 'define',
        value: function define(modelName, modelSchema) {
            this.models[modelName] = new _ormobject2.default(modelName, modelSchema, this.connection, this.appId);
        }
    }]);
    return Orm;
}(); // eslint-disable-next-line import/no-namespace


exports.default = Orm;