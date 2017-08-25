import Connection from './connection'
import OrmObject from './ormobject'

export default class Orm {
    constructor(connectionUrl, headers) {
        this.connection = new Connection(connectionUrl)
        this.appId = headers.app_id
    }
    define(modelName, modelShema) {
        this[modelName] = new OrmObject(
            modelName,
            modelShema,
            this.connection,
            this.appId
        )
    }
}
