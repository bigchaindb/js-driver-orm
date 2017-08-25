import * as driver from 'bigchaindb-driver' // eslint-disable-line import/no-namespace
import uuid from 'uuid/v4'

export default class OrmObject {
    constructor(modelName, modelShema, connection, appId = '', transactionList = []) {
        this._name = modelName
        this._shema = modelShema
        this._connection = connection
        this._appId = appId
        if (transactionList.length) {
            this.transactionList = transactionList
            this.id = transactionList[0].asset.data[`${this._appId}-${this._name}`].id
            this.metadata = transactionList[transactionList.length - 1].metadata
        }
    }

    retrieve(input) {
        const query = input || `"${this._appId}-${this._name}"`
        return this._connection.searchAssets(`"${query}"`)
            .then(assets =>
                Promise.all(assets.map(asset =>
                    this._connection.getSortedTransactions(asset.id)
                        .then(txList => {
                            return new OrmObject(
                                this._name,
                                this._shema,
                                this._connection,
                                this._appId,
                                txList
                            )
                        })
                ))
            )
    }

    create(inputs) {
        if (inputs === undefined) {
            console.error('inputs missing')
        }
        const assetPayload = {}
        assetPayload[`${this._appId}-${this._name}`] = {
            'shema': this._shema,
            'id': `id:${this._appId}:${uuid()}`
        }
        return this._connection.createTransaction(
            inputs.keypair.publicKey,
            inputs.keypair.privateKey,
            assetPayload,
            inputs.metadata
        )
            .then(tx => Promise.resolve(
                this._connection.getSortedTransactions(tx.id).then((txList) => {
                    return new OrmObject(
                        this._name,
                        this._shema,
                        this._connection,
                        this._appId,
                        txList
                    )
                })
            ))
    }

    append(inputs) {
        if (inputs === undefined) {
            console.error('inputs missing')
        }
        return this._connection.transferTransaction(
            this.transactionList[this.transactionList.length - 1],
            inputs.keypair.publicKey,
            inputs.keypair.privateKey,
            inputs.toPublicKey,
            inputs.metadata
        )
            .then(() => Promise.resolve(
                this._connection.getSortedTransactions(this.transactionList[0].id)
                    .then((txList) => {
                        return new OrmObject(
                            this._name,
                            this._shema,
                            this._connection,
                            this._appId,
                            txList
                        )
                    })
            ))
    }

    burn(inputs){
        if (inputs === undefined) {
            console.error('inputs missing')
        }
        const randomKeypair = new driver.Ed25519Keypair()
        return this._connection.transferTransaction(
            this.transactionList[this.transactionList.length - 1],
            inputs.keypair.publicKey,
            inputs.keypair.privateKey,
            randomKeypair.publicKey,
            { status: 'BURNED' }
        )
            .then(() => Promise.resolve(
                this._connection.getSortedTransactions(this.transactionList[0].id)
                    .then((txList) => {
                        return new OrmObject(
                            this._name,
                            this._shema,
                            this._connection,
                            this._appId,
                            txList
                        )
                    })
            ))
    }

}
