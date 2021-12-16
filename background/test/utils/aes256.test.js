import aes256 from "@/utils/aes256"

describe("aes256 test", () => {
    test('encrypt & decrypt', () => {
        const passphrase = 'PASSPHRASE'
        const plainText = 'Hello World'
        const encrypted = aes256.encrypt(plainText, passphrase)
        expect(() => aes256.decrypt(encrypted, 'Invalid Passphrase')).toThrowError()
        expect(aes256.decrypt(encrypted, passphrase)).toEqual(plainText)
    })
})