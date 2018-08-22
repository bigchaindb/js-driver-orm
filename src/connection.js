import * as driver from 'bigchaindb-driver' // eslint-disable-line import/no-namespace

export default class Connection {
    constructor(path, headers = {}) {
        this.path = path
        this.headers = Object.assign({}, headers)
        this.conn = new driver.Connection(path, headers)
    }

    getAssetId(tx) { // eslint-disable-line class-methods-use-this
        return tx.operation === 'CREATE' ? tx.id : tx.asset.id
    }

    getTransaction(transactionId) {
        return this.conn.getTransaction(transactionId)
    }

    listTransactions(assetId, operation) {
        return this.conn.listTransactions(assetId, operation)
    }

    searchAssets(text) {
        return this.conn.searchAssets(text)
    }

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
