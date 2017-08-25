# BigchainDB-ORM

> A CRAB-based ORM for BigchainDB.

## Table of Contents

- [Setup](#setup)
- [Usage](#usage)
- [Examples](#examples)
    - [Create a transaction](#create-a-transaction)
    - [Receive a transaction](#receive-a-transaction)
    - [Append a transaction](#append-a-transaction)
    - [Burn a transaction](#burn-a-transaction)
- [License](#license)

## Setup

```bash
$ npm install bigchaindb-orm
```

## Usage

```
// import bigchaindb-orm
import * as Orm from 'bigchaindb-orm'
// connect to bigchaindb
const bdbOrm = new Orm("https://test.ipdb.io/api/v1/",{
  app_id: "Get one from developers.ipdb.io",
  app_key: "Same as app_id"
})
// define our models and assets
bdbOrm.define("crab","https://example.com/v1/crab")
```

## Examples

All examples need bdbOrm initialized as described in usage

### Example: Create a transaction

```
// create public and private key for Alice
const aliceKeypair = new driver.Ed25519Keypair()
// from defined models in our bdbOrm
// we create crab with Alice as owner
bdbOrm.crab.create({
  keypair: aliceKeypair,
  metadata: {key:'metavalue'}
}).then((crab)=>{
  // crab is object with all our data and functions
  // crab.id is id of crab
  // crab.metadata is metadata of last transaction
  // crab.transactionList is transaction history
  console.log(crab.id)
}
```

### Example: Receive a transaction

```
// get all crabs with retrieve()
// or get specific crab with retrieve("crabid")
bdbOrm.crab.retrieve().then((crabs)=>{
  // output is array of crabs
  // lets output ids of our crabs
  console.log(crabs.map(crab=>{return crab.id}))
})
```

### Example: Append a transaction

```
// create public and private key for Alice
const aliceKeypair = new driver.Ed25519Keypair()
// create crab with Alice as owner
bdbOrm.crab.create({
  keypair: aliceKeypair,
  metadata: {key:'metavalue'}
}).then((crab)=>{
  // lets append metadata of our crab
  crab.append({
    toKeypair: aliceKeypair.publicKey,
    keypair: aliceKeypair,
    metadata: {key:'newvalue'}
  }).then((appendedCrab)=>{
    // appendedCrab is last state
    // of our crab so any actions
    // need to be done to appendedCrab
    console.log(appendedCrab.metadata)
  })
})
```

### Example: Burn a transaction

```
// create public and private key for Alice
const aliceKeypair = new driver.Ed25519Keypair()
// create crab with Alice as owner
bdbOrm.crab.create({
  keypair: aliceKeypair,
  metadata: {key:'metavalue'}
}).then((crab)=>{
  // lets append metadata of our crab
  crab.burn({
    keypair: aliceKeypair
  }).then((burnedCrab)=>{
    // crab burned sent to away
    console.log(burnedCrab.metadata)
  })
})
```

## License

```
Copyright 2017 BigchainDB GmbH

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
