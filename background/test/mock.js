import axios from "axios";

const MockAdapter = require("axios-mock-adapter")
const axiosMock = new MockAdapter(axios)

export default {
    graphql({endpoint = /.*/g, name='', data={}, once=false, responseCode=200}) {
        let onPost = axiosMock.onPost(endpoint, {
            asymmetricMatch: function (actual) {
                return actual['query'] && actual['query'].indexOf(name) >= 0;
            },
        })
        if (once) {
            onPost.replyOnce(responseCode, data);
        } else {
            onPost.reply(responseCode, data);
        }
    },
    mockGraphql() {
        this.graphql({
            endpoint: 'https://mars2.9cscan.com/graphql/',
            name:"getLastBlockIndex",
            data: {"data": {"chainQuery": {"blockQuery": {"blocks": [{"index": 2972520}]}}}}
        })

        this.graphql({
            name:"getBalance",
            data: {"data": {"goldBalance": 100}}
        })
        this.graphql({
            name:"getActivationStatus",
            data: {"data": {"activationStatus": {"addressActivated": true}}}
        })

        this.graphql({
            name:"unsignedTx",
            data: {"data": {transaction:{createUnsignedTx:"unsignedTx"}}}
        })
        this.graphql({
            name:"attachSignature",
            data: {"data": {transaction: {attachSignature: "tx"}}}
        })
        this.graphql({
            name:"stageTx",
            data: {data:{stageTxV2:"txId"}}
        })


    },
    mockStorage() {
        let data = {}
        global.chrome = {
            storage: {
                local: {
                    set: (obj) => {
                        for (let key of Object.keys(obj)) {
                            data[key] = obj[key]
                        }
                    },
                    get: (names, callback) => {
                        let result = {}
                        for (let name of names) {
                            result[name] = data[name]
                        }
                        callback(result)
                    },
                    remove: (key) => {
                        delete data[key]
                    },
                    clear: () => {
                        data = {}
                    }
                }
            }
        }
    }
}