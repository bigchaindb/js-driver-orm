import uuid from 'uuid/v4'

// The likelihood to generate a vanity address that is 11 times "Burn" is extremely low:
// - https://en.bitcoin.it/wiki/Vanitygen#Use_of_vanitygen_to_try_to_attack_addresses
const BURN_ADDRESS = 'BurnBurnBurnBurnBurnBurnBurnBurnBurnBurnBurn'

export default class OrmObject {
    constructor(modelName, modelSchema, connection, appId = 'global', transactionList = []) {
        this._name = modelName
        this._schema = modelSchema
        this._connection = connection
        this._appId = appId
        if (transactionList.length) {
            this.transactionHistory = transactionList
            this.id = transactionList[0].asset.data.id
            this.data = Object.assign({}, ...transactionList.map(tx => (tx.metadata)))
        }
    }

    retrieve(input = undefined) {
        let query
        if (input !== undefined && input !== '') {
            query = `"${input}"`
        } else {
            query = `"id:${this._appId}:${this._name}:"`
        }
        return this._connection.searchAssets(query)
            .then(assets =>
                Promise.all(assets.map(asset =>
                    this._connection.getSortedTransactions(asset.id)
                        .then(txList =>
                            new OrmObject(
                                this._name,
                                this._schema,
                                this._connection,
                                this._appId,
                                txList
                            )))))
    }

    create(inputs, id = uuid()) {
        if (inputs === undefined) {
            console.error('inputs missing')
        }
        const assetPayload = {
            'schema': this._schema,
            'id': `id:${this._appId}:${this._name}:${id}`
        }
        return this._connection
            .createTransaction(
                inputs.keypair.publicKey,
                inputs.keypair.privateKey,
                assetPayload,
                inputs.data
            )
            .then(tx => Promise.resolve(this._connection.getSortedTransactions(tx.id).then((txList) =>
                new OrmObject(
                    this._name,
                    this._schema,
                    this._connection,
                    this._appId,
                    txList
                ))))
    }

    append(inputs) {
        if (inputs === undefined) {
            console.error('inputs missing')
        }
        return this._connection
            .transferTransaction(
                this.transactionHistory[this.transactionHistory.length - 1],
                inputs.keypair.publicKey,
                inputs.keypair.privateKey,
                inputs.toPublicKey,
                inputs.data
            )
            .then(() =>
                Promise.resolve(this._connection.getSortedTransactions(this.transactionHistory[0].id)
                    .then((txList) =>
                        new OrmObject(
                            this._name,
                            this._schema,
                            this._connection,
                            this._appId,
                            txList
                        ))))
    }

    burn(inputs) {
        if (inputs === undefined) {
            console.error('inputs missing')
        }

        return this._connection
            .transferTransaction(
                this.transactionHistory[this.transactionHistory.length - 1],
                inputs.keypair.publicKey,
                inputs.keypair.privateKey,
                BURN_ADDRESS,
                { status: 'BURNED' }
            )
            .then(() =>
                Promise.resolve(this._connection.getSortedTransactions(this.transactionHistory[0].id)
                    .then((txList) =>
                        new OrmObject(
                            this._name,
                            this._schema,
                            this._connection,
                            this._appId,
                            txList
                        ))))
    }
}
