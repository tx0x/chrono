import Storage from "@/storage/storage"
import Mock from "../mock"
const passphrase = 'Storage Passphrase'

Mock.mockStorage()

describe("storage.js", () => {
    let storage
    let key, numValue, strValue, objValue, arrValue
    beforeAll(() => {
        storage = new Storage(passphrase)
    })
    beforeEach(() => {
        key = 'key' + Math.random()
        numValue = Math.random()
        strValue = Math.random().toString()
        objValue = {n: Math.random(), s: Math.random().toString()}
        arrValue = [Math.random(), Math.random()]
    })

    test('Basic behavior test of set, get', async () => {
        storage.clearAll()

        expect(await storage.has(key)).toBeFalsy()
        storage.set(key, numValue)
        expect(await storage.has(key)).toBeTruthy()
        expect(await storage.rawGet(key)).not.toBe(numValue)
        expect(await storage.get(key)).toBe(numValue)

        storage.set(key, strValue)
        expect(await storage.rawGet(key)).not.toBe(strValue)
        expect(await storage.get(key)).toBe(strValue)

        storage.set(key, objValue)
        expect(JSON.stringify(await storage.rawGet(key))).not.toBe(JSON.stringify(objValue))
        expect(JSON.stringify(await storage.get(key))).toBe(JSON.stringify(objValue))

        storage.set(key, arrValue)
        expect(JSON.stringify(await storage.rawGet(key))).not.toBe(JSON.stringify(arrValue))
        expect(JSON.stringify(await storage.get(key))).toBe(JSON.stringify(arrValue))
        await expect(storage.secureGet(key)).rejects.toEqual('SecureGet has accessed to not secured data')

        expect(await storage.get(key + 'INVALID')).toBe(null)
    })


    test('Basic behavior test of secureSet, secureGet', async () => {
        storage.clearAll()

        expect(storage.canCallExternal('secureSet')).toBeTruthy()
        expect(storage.canCallExternal('secureGet')).toBeFalsy()

        expect(await storage.has(key)).toBeFalsy()
        storage.secureSet(key, numValue)
        expect(await storage.has(key)).toBeTruthy()
        expect(await storage.secureGet(key)).toBe(numValue)
        await expect(storage.get(key)).rejects.toEqual('Can not access secure data')
        storage.remove(key)
        expect(await storage.has(key)).toBeFalsy()

        storage.secureSet(key, strValue)
        expect(await storage.secureGet(key)).toBe(strValue)
        await expect(storage.get(key)).rejects.toEqual('Can not access secure data')

        storage.secureSet(key, objValue)
        expect(JSON.stringify(await storage.secureGet(key))).toBe(JSON.stringify(objValue))
        await expect(storage.get(key)).rejects.toEqual('Can not access secure data')

        storage.secureSet(key, arrValue)
        expect(JSON.stringify(await storage.secureGet(key))).toBe(JSON.stringify(arrValue))
        await expect(storage.get(key)).rejects.toEqual('Can not access secure data')

        expect(await storage.secureGet(key + 'INVALID')).toBe(null)
    })
})