const callBackground = function(action, method, params = []) {
    return new Promise((resolve, reject) => {
        try {
            chrome.runtime.sendMessage({
                action,
                method,
                params:Array.isArray(params) ? params : [params]
            }, (res) => {
                if (res && typeof res === 'object' && res.hasOwnProperty('error')) {
                    if (res.error == 'NotSignedIn') {
                        location.reload()
                    } else {
                        console.log('error callBackground', res)
                        reject(res.error)
                    }
                } else {
                    resolve(res)
                }
            });
        } catch(e) {
            reject(e)
        }
    })
}

const callStorage = function(method, params) {
    return callBackground('storage', method, params)
}

const callWallet = function(method, params = []) {
    return callBackground('wallet', method, params)
}

export default {
    graphql: (method, params) => {
        return callBackground('graphql', method, params)
    },
    setPassphrase: (passphrase) => {
        return callBackground('passphrase', 'set', passphrase)
    },
    logout: () => {
        return callBackground('passphrase', 'remove')
    },
    checkTTL: async () => {
        return callBackground('passphrase', 'checkTTL')
    },
    isSignedIn: async () => {
        return callBackground('passphrase', 'isSignedIn')
    },
    isValidPassphrase: async (passphrase) => {
        return callBackground('passphrase', 'isValid', passphrase)
    },
    hasWallet: async () => {
        return callBackground('hasWallet')
    },
    storage: {
        set: async (name, value) => {
            return await callStorage('set', [name, value])
        },
        secureSet: async (name, value) => {
            return await callStorage('secureSet', [name, value])
        },
        get: async (name) => {
            return await callStorage('get', [name])
        },
        remove: async (name) => {
            return await callStorage('remove', [name])
        },
        has: async (name) => {
            return await callStorage('has', [name])
        },
        clearAll: async () => {
            return await callStorage('clearAll')
        }
    },
    wallet: {
        decrypt: async (walletJson) => {
            return await callWallet('decrypt', [walletJson])
        },
        createSequentialWallet: async (primaryAddress, index) => {
            return await callWallet('createSequentialWallet', [primaryAddress, index])
        },
        createPrivateKeyWallet: async (privateKey) => {
            return await callWallet('createPrivateKeyWallet', [privateKey])
        },
        sendNCG: async (sender, receiver, amount, nonce) => {
            return await callWallet('sendNCG', [sender, receiver, amount, nonce])
        },
        bridgeWNCG: async (sender, receiver, amount, nonce) => {
            return await callWallet('bridgeWNCG', [sender, receiver, amount, nonce])
        },
        nextNonce: async (address) => {
            return await callWallet('nextNonce', [address])
        },
        makeSignature: async (address, data) => {
            return await callWallet('makeSignature', [address, data])
        },
        getPrivateKey: async (address, passphrase) => {
            return await callWallet('getPrivateKey', [address, passphrase])
        },
        checkKMSAccount: async (keyId, publicKeyHex, region, accessKeyId, secretAccessKey) => {
            return await callWallet('checkKMSAccount', [keyId, publicKeyHex, region, accessKeyId, secretAccessKey]);
        }
    },
}