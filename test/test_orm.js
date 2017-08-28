import test from 'ava'

import * as driver from 'bigchaindb-driver'
import Orm from '../src/index'


test('Create asset with metadata', t => {
    const expected = { key: 'metadataValue' }

    const bdbOrm = new Orm('http://localhost:9984/api/v1/', 'testAppId')
    bdbOrm.define('myModel', 'https://schema.org/v1/myModel')
    // create a public and private key for Alice
    const aliceKeypair = new driver.Ed25519Keypair()
    return bdbOrm.myModel
        .create({
            keypair: aliceKeypair,
            metadata: expected
        })
        .then(res => t.deepEqual(res.metadata, expected))
})


test('Retrieve asset', t => {
    const expected = { key: 'metadataValue' }

    const bdbOrm = new Orm('http://localhost:9984/api/v1/', 'testAppId')
    bdbOrm.define('myModel', 'https://schema.org/v1/myModel')
    // create a public and private key for Alice
    const aliceKeypair = new driver.Ed25519Keypair()
    return bdbOrm.myModel
        .create({
            keypair: aliceKeypair,
            metadata: expected
        })
        .then(asset => bdbOrm.myModel.retrieve(asset.id))
        .then(res => t.deepEqual(res[0].metadata, expected))
})

test('Append asset', t => {
    const expected = { key: 'updatedValue' }

    const bdbOrm = new Orm('http://localhost:9984/api/v1/', 'testAppId')
    bdbOrm.define('myModel', 'https://schema.org/v1/myModel')
    // create a public and private key for Alice
    const aliceKeypair = new driver.Ed25519Keypair()
    return bdbOrm.myModel
        .create({
            keypair: aliceKeypair,
            metadata: { key: 'metadataValue' }
        })
        .then(asset => asset.append({
            toPublicKey: aliceKeypair.publicKey,
            keypair: aliceKeypair,
            metadata: expected
        }))
        .then(res => {
            t.deepEqual(res.metadata, expected)
            t.deepEqual(res.transactionList.length, 2)
        })
})

test('Burn asset', t => {
    const expected = { status: 'BURNED' }

    const bdbOrm = new Orm('http://localhost:9984/api/v1/', 'testAppId')
    bdbOrm.define('myModel', 'https://schema.org/v1/myModel')
    // create a public and private key for Alice
    const aliceKeypair = new driver.Ed25519Keypair()
    return bdbOrm.myModel
        .create({
            keypair: aliceKeypair,
            metadata: { key: 'metadataValue' }
        })
        .then(asset => asset.burn({
            keypair: aliceKeypair
        }))
        .then(res => {
            t.deepEqual(res.metadata, expected)
            t.deepEqual(res.transactionList.length, 2)
            t.not(res.transactionList[res.transactionList.length - 1]
                .outputs[0].public_keys[0], aliceKeypair.publicKey)
        })
})
