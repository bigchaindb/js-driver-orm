// eslint-disable-next-line import/no-namespace
import * as driver from 'bigchaindb-driver'
import Connection from './connection'
import OrmObject from './ormobject'

export default class Orm {
    constructor(connectionUrl, headers) {
        this.connection = new Connection(connectionUrl, headers)
        if (headers && headers.app_id !== undefined && headers.app_id !== '') {
            this.appId = headers.app_id
        } else {
            this.appId = 'global'
        }
        this.models = []
        this.driver = driver
    }
    define(modelName, modelSchema) {
        this.models[modelName] = new OrmObject(
            modelName,
            modelSchema,
            this.connection,
            this.appId
        )
    }
}
