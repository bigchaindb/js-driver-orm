/**
 * This module exposes getters and setters for bigchaindb components
 * @module
 */
import * as driver from 'bigchaindb-driver' // eslint-disable-line import/no-namespace

/** Wrapper class for bigchaindb driver connection module.*/
export default class Connection {
    /**
     * constructor for this class.
     * @param {string} path - bigchaindb network connection url.
     * @param {object} headers - object with app_id and app_key for connecting to bigchaindb network.
     */
    constructor(path, headers = {}) {
        this.path = path
        this.headers = Object.assign({}, headers)
        this.conn = new driver.Connection(path, headers)
    }

    /**
     * get asset id
     * @param {object} tx - transaction object
     */
    getAssetId(tx) { // eslint-disable-line class-methods-use-this
        return tx.operation === 'CREATE' ? tx.id : tx.asset.id
    }

    /**
     * get transaction
     * @param {string} transactionId - id of transaction to be retrieved
     */
    getTransaction(transactionId) {
        return this.conn.getTransaction(transactionId)
    }

    /**
     * get list of transactions
     * @param {string} assetId - id of asset containing transactions
     * @param {string} operation - typre of operation
     */
    listTransactions(assetId, operation) {
        return this.conn.listTransactions(assetId, operation)
    }

    /**
     * get list of {@link https://github.com/bigchaindb/site/blob/master/_src/_guide/key-concepts-of-bigchaindb.md#output|outputs} for given public key
     * @param {string} publicKey -  public key whose outputs are returned
     * @param {string} spent - TBD
     */
    listOutputs(publicKey, spent) {
        return this.conn.listOutputs(publicKey, spent)
    }

    /**
     * get a particular block using block id
     * @param {string} blockId - id of the required block
     */
    getBlock(blockId) {
        return this.conn.getBlock(blockId)
    }


    /**
     * get a list of blocks for a given transaction id
     * @param {string} transactionId - id of transaction whose blocks are returned
     */
    listBlocks(transactionId) {
        return this.conn.listBlocks(transactionId)
            .then(blockIds => Promise.all(blockIds.map(blockId => this.conn.getBlock(blockId))))
    }

    /**
     * get a list of votes for a given block id
     * @param {string} blockId -  id of block whose votes are returned
     */
    listVotes(blockId) {
        return this.conn.listVotes(blockId)
    }

    /**
     * search assets with text
     * @param {string} text - text to search assets
     */
    searchAssets(text) {
        return this.conn.searchAssets(text)
    }

    /**
     * creates asset in bigchaindb
     * @param {string} publicKey - public key of the asset owner
     * @param {string} privateKey -  private key of the asset owner
     * @param {object} payload - object containing asset details (cannot be changed later)
     * @param {string} metadata - additional editable details of the asset
     */
    createTransaction(publicKey, privateKey, payload, metadata) {
        try {
            // Create a transation
            const tx = driver.Transaction.makeCreateTransaction(
                payload,
                metadata,
                [
                    driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(publicKey))
                ],
                publicKey
            )

            // sign/fulfill the transaction
            const txSigned = driver.Transaction.signTransaction(tx, privateKey)
            return this.conn.postTransactionCommit(txSigned).then(() => txSigned)
        } catch (error) {
            return Promise.reject(error)
        }
    }

    /**
     * transfers asset in bigchaindb
     * @param {object} tx - transaction object for this transfer
     * @param {string} fromPublicKey - public key of current asset owner
     * @param {string} fromPrivateKey - private key of current asset owner
     * @param {string} toPublicKey - public key of new asset owner
     * @param {object} metadata - additional details for this asset
     */
    transferTransaction(tx, fromPublicKey, fromPrivateKey, toPublicKey, metadata) {
        try {
            const txTransfer = driver.Transaction.makeTransferTransaction(
                [{ 'tx': tx, 'output_index': 0 }],
                [driver.Transaction.makeOutput(driver.Transaction.makeEd25519Condition(toPublicKey))],
                metadata,
            )
            const txTransferSigned = driver.Transaction.signTransaction(txTransfer, fromPrivateKey)
            // send it off to BigchainDB
            return this.conn.postTransactionCommit(txTransferSigned).then(() => txTransferSigned)
        } catch (error) {
            return Promise.reject(error)
        }
    }

    /**
     * returns sorted transactions for given asset id
     * @param {string} assetId - id of asset whose transactions needs to be sorted
     */
    getSortedTransactions(assetId) {
        return this.conn.listTransactions(assetId)
            .then((txList) => {
                if (txList.length <= 1) {
                    return txList
                }
                const inputTransactions = []
                txList.forEach((tx) =>
                    tx.inputs.forEach(input => {
                        if (input.fulfills) {
                            inputTransactions.push(input.fulfills.transaction_id)
                        }
                    }))
                const unspents = txList.filter((tx) => inputTransactions.indexOf(tx.id) === -1)
                if (unspents.length) {
                    let tipTransaction = unspents[0]
                    let tipTransactionId = tipTransaction.inputs[0].fulfills.transaction_id
                    const sortedTxList = []
                    while (true) { // eslint-disable-line no-constant-condition
                        sortedTxList.push(tipTransaction)
                        try {
                            tipTransactionId = tipTransaction.inputs[0].fulfills.transaction_id
                        } catch (e) {
                            break
                        }
                        if (!tipTransactionId) {
                            break
                        }
                        tipTransaction = txList.filter((tx) => // eslint-disable-line no-loop-func, prefer-destructuring
                            tx.id === tipTransactionId)[0]
                    }
                    return sortedTxList.reverse()
                } else {
                    console.error(
                        'something went wrong while sorting transactions',
                        txList, inputTransactions
                    )
                }
                return txList
            })
    }
}
