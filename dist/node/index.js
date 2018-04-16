'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bigchaindbDriver = require('bigchaindb-driver');

var driver = _interopRequireWildcard(_bigchaindbDriver);

var _connection = require('./connection');

var _connection2 = _interopRequireDefault(_connection);

var _ormobject = require('./ormobject');

var _ormobject2 = _interopRequireDefault(_ormobject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Orm = function () {
    function Orm(connectionUrl, headers) {
        _classCallCheck(this, Orm);

        this.connection = new _connection2.default(connectionUrl, headers);
        this.appId = '';
        if (headers && headers.app_id) {
            this.appId = headers.app_id;
        }
        this.models = [];
        this.driver = driver;
    }

    _createClass(Orm, [{
        key: 'define',
        value: function define(modelName, modelSchema) {
            this.models[modelName] = new _ormobject2.default(modelName, modelSchema, this.connection, this.appId);
        }
    }]);

    return Orm;
}();

exports.default = Orm;