import crypto from "crypto"
import Graphql from "@/api/graphql"
import Storage from "@/storage/storage"
import {ENCRYPTED_WALLET, TXS} from "@/constants/constants"
import keccak256 from "keccak256"
import { createAccount } from "@planetarium/account-raw"
import { signTransaction } from "@planetarium/sign"

const Web3 = require('web3')
const ethers = require('ethers')
const {encode} = require("bencodex")

export default class Wallet {
    constructor(passphrase) {
        this.api = new Graphql()
        this.storage = new Storage(passphrase)
        this.passphrase = passphrase
        this.canCall = ['createSequentialWallet', 'createPrivateKeyWallet', 'sendNCG', 'bridgeWNCG', 'nextNonce', 'getPrivateKey']
    }
    canCallExternal(method) {
        return this.canCall.indexOf(method) >= 0
    }
    hexToBuffer(hex) {
        return Buffer.from(ethers.utils.arrayify(hex, {allowMissingPrefix: true}))
    }
    decryptWallet(encryptedWalletJson, passphrase) {
        return ethers.Wallet.fromEncryptedJsonSync(encryptedWalletJson, passphrase || this.passphrase)
    }
    async isValidNonce(nonce) {
        let pendingNonce = await this.storage.get('nonce')
        return pendingNonce == nonce
    }
    async nextNonce() {
        let pendingNonce = String(+new Date).concat(Math.random().toFixed(10).replace('.',''))
        this.storage.set('nonce', pendingNonce)
        return pendingNonce
    }
    async sign(address, data) {
        let encryptedWalletJson = await this.storage.secureGet(ENCRYPTED_WALLET + address.toLowerCase())
        let wallet = await this.decryptWallet(encryptedWalletJson)
        let message = keccak256(Web3.utils.encodePacked(...data))
        return await wallet.signMessage(message)
    }
    async validateSignature(signature, data, address) {
        let message = keccak256(Web3.utils.encodePacked(...data))
        return ((await ethers.utils.recoverAddress(ethers.utils.hashMessage(message), signature)).toLowerCase() == address.toLowerCase())
    }
    async createSequentialWallet(primaryAddress, index) {
        let primaryEncryptedWalletJson = await this.storage.secureGet(ENCRYPTED_WALLET + primaryAddress.toLowerCase())
        let wallet = await this.decryptWallet(primaryEncryptedWalletJson)

        let mnemonic = wallet._mnemonic().phrase

        let newWallet = ethers.Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/" + index)
        let encryptedWallet = await newWallet.encrypt(this.passphrase)
        let address = newWallet.address

        return {address, encryptedWallet}
    }
    async createPrivateKeyWallet(privateKey) {
        let wallet = new ethers.Wallet(privateKey)
        let encryptedWallet = await wallet.encrypt(this.passphrase)
        let address = wallet.address

        return {address, encryptedWallet}
    }
    async _transferNCG(sender, receiver, amount, nonce, memo) {
        if (!await this.isValidNonce(nonce)) {
            throw 'Invalid Nonce'
        }

        let senderEncryptedWallet = await this.storage.secureGet(ENCRYPTED_WALLET + sender.toLowerCase())
        let wallet = await this.decryptWallet(senderEncryptedWallet)
        const plainValue = {
            type_id: "transfer_asset2",
            values: {
                amount: [
                    {
                        decimalPlaces: Buffer.from([0x02]),
                        minters: [this.hexToBuffer("47d082a115c63e7b58b1532d20e631538eafadde")],
                        ticker: 'NCG'
                    },
                    Number((amount * 100).toFixed())
                ],
                ...(memo ? { memo } : {}),
                recipient: this.hexToBuffer(receiver),
                sender: this.hexToBuffer(wallet.address)
            }
        };
        let {transaction:{createUnsignedTx:unsignedTx}} = await this.api.unsignedTx(encode(plainValue).toString('base64'), this.hexToBuffer(wallet.publicKey).toString('base64'))

        let account = createAccount(wallet.privateKey);
        let signedTx = signTransaction(unsignedTx, account);
        const {data:{stageTxV2:txId}, endpoint} = await this.api.stageTx(signedTx);
        return {txId, endpoint};
    }

    async sendNCG(sender, receiver, amount, nonce) {
        let {txId, endpoint} = await this._transferNCG(sender, receiver, amount, nonce)
        let result = {
            id: txId,
            endpoint,
            status: 'STAGING',
            type: 'transfer_asset2',
            timestamp: +new Date,
            signer: sender,
            data: {
                sender: sender,
                receiver: receiver,
                amount: amount
            }
        }

        await this.addPendingTxs(result)
        return result
    }

    async bridgeWNCG(sender, receiver, amount, nonce) {
        let {txId, endpoint} = await this._transferNCG(sender, '0x9093dd96c4bb6b44a9e0a522e2de49641f146223', amount, nonce, receiver)
        let result = {
            id: txId,
            endpoint,
            status: 'STAGING',
            action: 'bridgeWNCG',
            type: 'transfer_asset2',
            timestamp: +new Date,
            signer: sender,
            data: {
                sender: sender,
                receiver: receiver,
                amount: amount
            }
        }

        await this.addPendingTxs(result)
        return result
    }

    async addPendingTxs(tx) {
        let txs = await this.storage.get(TXS + tx.signer.toLowerCase())
        if (!txs) {
            txs = []
        }
        txs.unshift(tx)
        await this.storage.set(TXS + tx.signer.toLowerCase(), txs.splice(0, 100))
    }

    async getPrivateKey(address, passphrase) {
        let encryptedWallet = await this.storage.secureGet(ENCRYPTED_WALLET + address.toLowerCase())
        let wallet = await this.decryptWallet(encryptedWallet, passphrase)
        return wallet.privateKey
    }
}
