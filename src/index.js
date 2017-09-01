import Connection from './connection'
import OrmObject from './ormobject'

export default class Orm {
    constructor(connectionUrl, headers) {
        this.connection = new Connection(connectionUrl)
        this.appId = headers.app_id
    }
    define(modelName, modelSchema) {
        this[modelName] = new OrmObject(
            modelName,
            modelSchema,
            this.connection,
            this.appId
        )
    }
}
