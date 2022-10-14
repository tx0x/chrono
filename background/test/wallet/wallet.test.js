import Wallet from "@/wallet/wallet"
import Mock from "../mock"
import {ENCRYPTED_WALLET} from "@/constants/constants"
import crypto from "crypto";
import {sign} from "eccrypto";
import keccak256 from "keccak256";
const ethers = require("ethers")
const eccrypto = require("eccrypto")

Mock.mockGraphql()
Mock.mockStorage()
jest.setTimeout(1000 * 60)
const passphrase = 'pass'
describe("wallet.js", () => {
    let wallet, address
    beforeAll(async () => {
        wallet = new Wallet(passphrase)
        let w = ethers.Wallet.createRandom({locale: 'en'})
        address = w.address
        let ew = await w.encrypt(passphrase)
        wallet.storage.secureSet(ENCRYPTED_WALLET + address.toLowerCase(), ew)
    })

    test('Checking can call external', () => {
        expect(wallet.canCallExternal('decryptWallet')).toBeFalsy()
    })

    test('Generate sequential wallet test', async () => {
        let {address:address0} = await wallet.createSequentialWallet(address, 0)
        let {address:address1} = await wallet.createSequentialWallet(address, 1)
        expect(address0).toBe(address)
        expect(address1).not.toBe(address)
        expect(address1.length).toBe(address.length)
    })

    test('Generate private wallet test', async () => {
        let privateKey = await wallet.getPrivateKey(address, passphrase)
        let {address:address0} = await wallet.createPrivateKeyWallet(privateKey)
        expect(address0).toBe(address)
    })

    test('Sign & Validate test', async () => {
        let data = ['Hello World']
        let signature = await wallet.sign(address, data)
        expect(await wallet.validateSignature(signature, data, address)).toBeTruthy()
    })

    test('eccrypto sign', async () => {
        let privateKey = '0x5b723d0f796c15951cfcb0134351f59279c0e95fbdc8496bd71213d20ee4f66a'
        console.log('pk', privateKey)
        let message = crypto.createHash('sha256').update('hello', 'base64').digest();
        console.log('message', ethers.utils.hexlify(message))
        eccrypto.sign(Buffer.from(ethers.utils.arrayify(privateKey, {allowMissingPrefix: true})), message).then(sig => {
            console.log(ethers.utils.hexlify(sig))
        })

    })

    test('Mock send NCG test', async () => {
        let receiver = '0x48BD02A8ADe581A55743646c8880F307F2e8e79D'
        await expect(async () => await wallet.sendNCG(address, 'other', 100, 1)).rejects.toEqual("Invalid Nonce")
        let result = await wallet.sendNCG(address, receiver, 100, await wallet.nextNonce())

        expect(result['status']).toBe('STAGING')
        expect(result['signer']).toBe(address)
        expect(result['data']['sender']).toBe(address)
        expect(result['data']['receiver']).toBe(receiver)
        expect(result['data']['amount']).toBe(100)
    })

    test('Mock bridge NCG test', async () => {
        let receiver = '0x48BD02A8ADe581A55743646c8880F307F2e8e79D'
        let result = await wallet.bridgeWNCG(address, receiver, 100, await wallet.nextNonce())

        expect(result['status']).toBe('STAGING')
        expect(result['signer']).toBe(address)
        expect(result['data']['sender']).toBe(address)
        expect(result['data']['receiver']).toBe(receiver)
        expect(result['data']['amount']).toBe(100)
    })
})