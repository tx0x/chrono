import axios from 'axios'

const MAINNET_ENDPOINTS = [
    'https://mars2.9cscan.com/graphql/',
    'https://mercury2.9cscan.com/graphql/',
    'https://d131807iozwu1d.cloudfront.net/graphql/'
]
window.networkInterval = 0
export default class Graphql {
    constructor() {
        this.updateNetwork()
        this.canCall = ['updateNetwork', 'getLastBlockIndex', 'getBalance', 'getActivationStatus', 'getTransactionStatus']
    }
    canCallExternal(method) {
        return this.canCall.indexOf(method) >= 0
    }

    updateNetwork(network = 'mainnet') {
        let endpoints = null
        if (network === 'mainnet') {
            endpoints = MAINNET_ENDPOINTS

            if (!this.endpoints) {
                this.endpoints = [...endpoints]
            }

            this.updateEndpoints(endpoints)
        } else {
            throw 'Unknown Network ' + network
        }
    }

    //block index가 30개 이상 뒤쳐지면 제거
    async updateEndpoints(endpoints) {
        let resultEp = {}
        let maxIdx = 0
        for (let endpoint of endpoints) {
            try {
                let lastIdx = await this.getLastBlockIndex(endpoint)
                maxIdx = Math.max(maxIdx, lastIdx)
                resultEp[endpoint] = lastIdx
            } catch(e) {
            }
        }
        let eps = []
        for (let endpoint of Object.keys(resultEp)) {
            if (maxIdx - resultEp[endpoint] < 30) {
                eps.push(endpoint)
            }
        }

        this.endpoints = endpoints.filter(ep => eps.indexOf(ep) >= 0)
        console.log(endpoints)
    }

    async callEndpoint(fn) {
        let exceptions = []
        for (let endpoint of this.endpoints) {
            try {
                let result = await fn(endpoint)
                return result
            } catch(e) {
                exceptions.push(e)
            }
        }

        if (exceptions.length > 0) {
            throw {...exceptions[0], exceptions}
        }
    }

    async getLastBlockIndex(endpoint) {
        let {data} = await axios.create({timeout: 10000})({
            method: 'POST',
            url: endpoint,
            data: {
                "variables":{"offset": 0},
                "query":`
                  query getBlock($offset: Int!) {
                    chainQuery {
                      blockQuery {
                        blocks(offset: $offset, limit: 1, desc:true) {
                          index
                        }
                      }
                    }
                  }
                  `
            }
        })
        return data['data']['chainQuery']['blockQuery']['blocks'][0]['index']
    }

    async getBalance(address) {
        return this.callEndpoint(async (endpoint) => {
            let {data} = await axios.create({timeout: 10000})({
                method: 'POST',
                url: endpoint,
                data: {
                    "variables":{"address": address},
                    "query":`
                  query getAgent($address: Address!) {
                    goldBalance(address: $address)
                  }
                `
                }
            })

            return data['data']['goldBalance']
        })
    }

    async unsignedTx(plainValue, publicKey) {
        return this.callEndpoint(async (endpoint) => {
            let {data} = await axios({
                method: 'POST',
                url: endpoint,
                data: {
                    "variables": {"publicKey": publicKey, "plainValue": plainValue},
                    "query": `
                      query query($publicKey: String!, $plainValue: String!) {
                        transaction {
                          createUnsignedTx(publicKey: $publicKey, plainValue: $plainValue)
                        }
                      }
                    `
                }
            })
            return data['data']
        })
    }

    async attachSignature(unsignedTx, base64Sign) {
        return this.callEndpoint(async (endpoint) => {
            let {data} = await axios({
                method: 'POST',
                url: endpoint,
                data: {
                    "variables": {unsignedTx, signature: base64Sign},
                    "query": `
                      query query($unsignedTx: String!, $signature: String!) {
                        transaction {
                          attachSignature(unsignedTransaction: $unsignedTx, signature: $signature)
                        }
                      }
                    `
                }
            })
            return data['data']
        })
    }

    async stageTx(payload) {
        return this.callEndpoint(async (endpoint) => {
            let {data} = await axios({
                method: 'POST',
                url: endpoint,
                data: {
                    "variables": {payload},
                    "query": `
                      mutation transfer($payload: String!) {
                        stageTxV2(payload: $payload)
                      }
                    `
                }
            })
            return {data: data['data'], endpoint}
        })
    }

    async getActivationStatus(address) {
        return this.callEndpoint(async (endpoint) => {
            let {data} = await axios({
                method: 'POST',
                url: endpoint,
                data: {
                    "variables": {address},
                    "query": `
                      query activation($address: Address!) {
                          activationStatus {
                            addressActivated(address: $address)
                          }
                        }
                    `
                }
            })
            return data['data']['activationStatus']['addressActivated']
        })
    }

    async getTransactionStatus({txId, endpoint}) {
        let {data} = await axios({
            method: 'POST',
            url: endpoint,
            data: {
                "variables": {txId},
                "query": `
                  query query($txId: TxId!) {
                      transaction {
                        transactionResult(txId: $txId) {
                          txStatus
                        }
                      }
                    }
                `
            }
        })
        return data['data']['transaction']['transactionResult']['txStatus']
    }
}