/**
 * Entry module. Defines model for the orm
 * @module
 */
// eslint-disable-next-line import/no-namespace
import * as driver from 'bigchaindb-driver'
import Connection from './connection'
import OrmObject from './ormobject'

/** main class for this driver.*/
export default class Orm {
    /**
     * constructor for this class.
     * @param {string} connectionUrl - bigchaindb network connection url.
     * @param {object} headers - object with app_id and app_key for connecting to bigchaindb network.
     */
    constructor(connectionUrl, headers) {
        this.connection = new Connection(connectionUrl, headers)
        this.appId = ''
        if (headers && headers.app_id) {
            this.appId = headers.app_id
        }
        this.models = []
        this.driver = driver
    }
    /**
     * define model that will be used for each instance of the model
     * @param {string} modelName - represents the name of model you want to store
     * @param {string} modelSchema - any additional info (like schema etc.) about the model.
     * note: cannot be changed once set!
     */
    define(modelName, modelSchema) {
        this.models[modelName] = new OrmObject(
            modelName,
            modelSchema,
            this.connection,
            this.appId
        )
    }
}
