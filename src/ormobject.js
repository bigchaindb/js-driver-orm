/**
 * This module covers core CRAB operations.
 * @module
 */
import uuid from 'uuid/v4'

// The likelihood to generate a vanity address that is 11 times "Burn" is extremely low:
// - https://en.bitcoin.it/wiki/Vanitygen#Use_of_vanitygen_to_try_to_attack_addresses
const BURN_ADDRESS = 'BurnBurnBurnBurnBurnBurnBurnBurnBurnBurnBurn'

/** core class for CRAB operations. */
export default class OrmObject {
    /**
     * constructor for this class
     * @param {string} modelName - name of the model
     * @param {string} modelSchema - additional details for this model
     * @param {object} connection - connection object for bigchaindb network
     * @param {string} appId -  id of the app under use
     * @param {object} transactionList - list of transactions
     */
    constructor(modelName, modelSchema, connection, appId = '', transactionList = []) {
        this._name = modelName
        this._schema = modelSchema
        this._connection = connection
        this._appId = appId
        if (transactionList.length) {
            this.transactionHistory = transactionList
            this.id = transactionList[0].asset.data[`${this._appId}-${this._name}`].id
            this.data = Object.assign({}, ...transactionList.map(tx => (tx.metadata)))
        }
    }

    /**
     * retrieves the asset for a given input query
     * @param {object} input - query to retrieve asset
     */
    retrieve(input) {
        const query = input || `"${this._appId}-${this._name}"`
        return this._connection.searchAssets(`"${query}"`)
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

    /**
     * creates the asset in bigchaindb
     * @param {object} inputs - object containing keypairs and data for the asset
     */
    create(inputs) {
        if (inputs === undefined) {
            console.error('inputs missing')
        }
        const assetPayload = {}
        assetPayload[`${this._appId}-${this._name}`] = {
            'schema': this._schema,
            'id': `id:${this._appId}:${uuid()}`
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

    /**
     * appends (i.e. transfer transaction) the asset in bigchaindb
     * @param {object} inputs - object incl. public key of new owner and private key for current owner
     */
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

    /**
     * burns the asset to unretrievable address
     * @param {object} inputs - object containing details of burn address (i.e. public key)
     */
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
