import sinon from 'sinon'
import test from 'ava'

import Orm from '../src/index'
import Connection from '../src/connection'

test('Create asset with data', t => {
    const expected = { key: 'dataValue' }

    const bdbOrm = new Orm('http://localhost:9984/api/v1/', {
        app_id: '',
        app_key: ''
    })
    bdbOrm.define('myModel', 'https://schema.org/v1/myModel')
    // create a public and private key for Alice
    const aliceKeypair = new bdbOrm.driver.Ed25519Keypair()
    return bdbOrm.models.myModel
        .create({
            keypair: aliceKeypair,
            data: expected
        })
        .then(res => t.deepEqual(res.data, expected))
})

test('Create asset with user provided id', t => {
    const expected = { key: 'dataValue' }
    const id = 'My-Unique-ID'
    const bdbOrm = new Orm('http://localhost:9984/api/v1/', {
        app_id: '',
        app_key: ''
    })
    bdbOrm.define('myModel', 'https://schema.org/v1/myModel')
    // create a public and private key for Alice
    const aliceKeypair = new bdbOrm.driver.Ed25519Keypair()
    return bdbOrm.models.myModel
        .create({
            keypair: aliceKeypair,
            data: expected
        }, id)
        .then(res => t.deepEqual(res.data, expected))
})

test('Retrieve asset', t => {
    const expected = { key: 'dataValue' }

    const bdbOrm = new Orm('http://localhost:9984/api/v1/', {
        app_id: '',
        app_key: ''
    })
    bdbOrm.define('myModel', 'https://schema.org/v1/myModel')
    // create a public and private key for Alice
    const aliceKeypair = new bdbOrm.driver.Ed25519Keypair()
    return bdbOrm.models.myModel
        .create({
            keypair: aliceKeypair,
            data: expected
        })
        .then(asset => bdbOrm.models.myModel.retrieve(asset.id))
        .then(res => t.deepEqual(res[0].data, expected))
})

test('Retrieve multiple asset', async (t) => {
    const bdbOrm = new Orm('http://localhost:9984/api/v1/', {
        app_id: '',
        app_key: ''
    })
    bdbOrm.define('myNewModel', 'https://schema.org/v1/myNewModel')
    // create a public and private key for Alice
    const aliceKeypair = new bdbOrm.driver.Ed25519Keypair()
    const expected = await bdbOrm.models.myNewModel.retrieve().then(res => res.length) + 1

    return bdbOrm.models.myNewModel
        .create({
            keypair: aliceKeypair,
            data: { key: 'dataValue' }
        })
        .then(() => bdbOrm.models.myNewModel.retrieve()
            .then(res => t.deepEqual(res.length, expected)))
})

test('Append asset', t => {
    const expected = {
        key: 'dataValue',
        keyToUpdate: 'updatedDataValue',
        newKey: 'newDataValue'
    }

    const bdbOrm = new Orm('http://localhost:9984/api/v1/', {
        app_id: '',
        app_key: ''
    })
    bdbOrm.define('myModel', 'https://schema.org/v1/myModel')
    // create a public and private key for Alice
    const aliceKeypair = new bdbOrm.driver.Ed25519Keypair()
    return bdbOrm.models.myModel
        .create({
            keypair: aliceKeypair,
            data: { key: 'dataValue', keyToUpdate: 'dataUpdatableValue' }
        })
        .then(asset => asset.append({
            toPublicKey: aliceKeypair.publicKey,
            keypair: aliceKeypair,
            data: { keyToUpdate: 'updatedDataValue', newKey: 'newDataValue' }
        }))
        .then(res => {
            t.deepEqual(res.data, expected)
            t.deepEqual(res.transactionHistory.length, 2)
        })
})

test('Burn asset', t => {
    const expected = { key: 'dataValue', status: 'BURNED' }

    const bdbOrm = new Orm('http://localhost:9984/api/v1/', {
        app_id: '',
        app_key: ''
    })
    bdbOrm.define('myModel', 'https://schema.org/v1/myModel')
    // create a public and private key for Alice
    const aliceKeypair = new bdbOrm.driver.Ed25519Keypair()
    return bdbOrm.models.myModel
        .create({
            keypair: aliceKeypair,
            data: { key: 'dataValue' }
        })
        .then(asset => asset.burn({
            keypair: aliceKeypair
        }))
        .then(res => {
            t.deepEqual(res.data, expected)
            t.deepEqual(res.transactionHistory.length, 2)
            t.not(res.transactionHistory[res.transactionHistory.length - 1]
                .outputs[0].public_keys[0], aliceKeypair.publicKey)
        })
})

test('Orm stores notices the headers appId', t => {
    const bdbOrm = new Orm('http://localhost:9984/api/v1/', { app_id: 'AppID' })

    t.is(bdbOrm.appId, 'AppID')
})

test.serial('Orm console logs an error if inputs is undefined calling create', t => {
    const bdbOrm = new Orm('http://localhost:9984/api/v1/')

    t.context.consoleError = console.error
    console.error = sinon.spy()

    bdbOrm.define('myModel', 'https://schema.org/v1/myModel')

    try {
        bdbOrm.models.myModel.create()
    } catch (e) {
        // noop
    }

    t.true(console.error.calledOnce)
    console.error = t.context.consoleError
})

test.serial('Orm console logs an error if inputs is undefined calling append', t => {
    const bdbOrm = new Orm('http://localhost:9984/api/v1/')

    t.context.consoleError = console.error
    console.error = sinon.spy()

    bdbOrm.define('myModel', 'https://schema.org/v1/myModel')

    try {
        bdbOrm.models.myModel.append()
    } catch (e) {
        // noop
    }

    t.true(console.error.calledOnce)
    console.error = t.context.consoleError
})

test.serial('Orm console logs an error if inputs is undefined calling burn', t => {
    const bdbOrm = new Orm('http://localhost:9984/api/v1/')

    t.context.consoleError = console.error
    console.error = sinon.spy()

    bdbOrm.define('myModel', 'https://schema.org/v1/myModel')

    try {
        bdbOrm.models.myModel.burn()
    } catch (e) {
        // noop
    }

    t.true(console.error.calledOnce)
    console.error = t.context.consoleError
})

test('Connection returns transaction id as assetId when transaction is a CREATE', t => {
    const tx = { asset: { id: 'a-fake-asset-id' }, operation: 'CREATE', id: 'a-fake-tx-id' }
    const conn = new Connection('/')

    t.is(conn.getAssetId(tx), tx.id)
})

test('Connection returns asset id as assetId when transaction is not a CREATE', t => {
    const tx = { asset: { id: 'a-fake-asset-id' }, operation: 'OTHER', id: 'a-fake-tx-id' }
    const conn = new Connection('/')

    t.is(conn.getAssetId(tx), tx.asset.id)
})

test('Connection proxies getTransaction to bigchaindb-driver', t => {
    const conn = new Connection('/')
    conn.conn = { getTransaction(id) { return id === 'a-fake-id' } }

    t.true(conn.getTransaction('a-fake-id'))
})

test('Connection proxies listTransactions to bigchaindb-driver', t => {
    const conn = new Connection('/')
    conn.conn = { listTransactions(id, op) { return id === 'a-fake-id' && op === 'CREATE' } }

    t.true(conn.listTransactions('a-fake-id', 'CREATE'))
})

test('Connection#createTransaction rejects the promise returned on error', async t => {
    const conn = new Connection('/')

    await t.throws(conn.createTransaction(1, 2, 3, 4))
})

test('Connection#transferTransaction rejects the promise returned on error', async t => {
    const conn = new Connection('/')

    await t.throws(conn.transferTransaction(1, 2, 3, 4, 5))
})

test.serial(
    'Connection#getSortedTransactions logs an error if none of the transactions are unspents',
    async t => {
        const conn = new Connection('/')
        const txList = { filter: sinon.stub(), forEach: sinon.stub(), length: 2 }

        t.context.consoleError = console.error
        console.error = sinon.spy()

        conn.conn = {}
        conn.conn.listTransactions = sinon.stub()
        conn.conn.listTransactions.returns(new Promise((resolve) => { resolve(txList) }))
        txList.forEach.returns(true)
        txList.filter.returns([])

        await conn.getSortedTransactions()

        t.true(console.error.calledOnce)
        console.error = t.context.consoleError
    }
)
