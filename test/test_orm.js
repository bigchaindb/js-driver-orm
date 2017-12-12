import test from 'ava'

import * as driver from 'bigchaindb-driver' // eslint-disable-line import/no-namespace
import Orm from '../src/index'


test('Create asset with data', t => {
    const expected = { key: 'dataValue' }

    const bdbOrm = new Orm('http://127.0.0.1:9984/api/v1/', {
        app_id: '',
        app_key: ''
    })
    bdbOrm.define('myModel', 'https://schema.org/v1/myModel')
    // create a public and private key for Alice
    const aliceKeypair = new driver.Ed25519Keypair()
    return bdbOrm.myModel
        .create({
            keypair: aliceKeypair,
            data: expected
        })
        .then(res => t.deepEqual(res.data, expected))
})


test('Retrieve asset', t => {
    const expected = { key: 'dataValue' }

    const bdbOrm = new Orm('http://127.0.0.1:9984/api/v1/', {
        app_id: '',
        app_key: ''
    })
    bdbOrm.define('myModel', 'https://schema.org/v1/myModel')
    // create a public and private key for Alice
    const aliceKeypair = new driver.Ed25519Keypair()
    return bdbOrm.myModel
        .create({
            keypair: aliceKeypair,
            data: expected
        })
        .then(asset => bdbOrm.myModel.retrieve(asset.id))
        .then(res => t.deepEqual(res[0].data, expected))
})

test('Append asset', t => {
    const expected = {
        key: 'dataValue',
        keyToUpdate: 'updatedDataValue',
        newKey: 'newDataValue'
    }

    const bdbOrm = new Orm('http://127.0.0.1:9984/api/v1/', {
        app_id: '',
        app_key: ''
    })
    bdbOrm.define('myModel', 'https://schema.org/v1/myModel')
    // create a public and private key for Alice
    const aliceKeypair = new driver.Ed25519Keypair()
    return bdbOrm.myModel
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

    const bdbOrm = new Orm('http://127.0.0.1:9984/api/v1/', {
        app_id: '',
        app_key: ''
    })
    bdbOrm.define('myModel', 'https://schema.org/v1/myModel')
    // create a public and private key for Alice
    const aliceKeypair = new driver.Ed25519Keypair()
    return bdbOrm.myModel
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
