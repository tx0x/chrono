/**
 * @jest-environment jsdom
 */
import { shallowMount } from '@vue/test-utils'
import Initiate from "@/views/Initiate.vue"
import InitiateMnemonic from "@/views/InitiateMnemonic.vue"
jest.setTimeout(1000*60)
describe("Initiate", () => {
    test("create password & validate password", async () => {
        const wrapper = shallowMount(Initiate)
        const checkPassword = (pass, valid) => {
            wrapper.vm.pass1 = pass
            wrapper.vm.pass2 = pass
            expect(wrapper.vm.isValidPassword).toEqual(valid)
        }

        checkPassword('', false)
        checkPassword('1', false)
        checkPassword('12', false)
        checkPassword('123', false)
        checkPassword('1234', false)
        checkPassword('12345', false)
        checkPassword('123456', false)
        checkPassword('1234567', false)
        checkPassword('12345678', true)
        checkPassword('123456789', true)
        expect(wrapper.vm.ruleConfirmPassword[2]()).toBeTruthy()
    })

    test("create account without passphrase", async () => {
        await shallowMount(InitiateMnemonic, {
            mocks: {
                $route: {
                    params: {},
                    query: {mode: 'recover'}
                },
                $router: {
                    replace: async ({name}) => {
                        expect(name).toEqual('initiate')
                    }
                }
            }
        })
    })
    test("create account", async () => {
        let passphrase = '12345678'
        const wrapper = await shallowMount(InitiateMnemonic, {
            mocks: {
                $route: {
                    params: {passphrase},
                },
                $router: {
                    replace: async ({name}) => {
                        expect(name).toEqual('index')
                    }
                },
                $store: {
                    dispatch: async (name, data) => {
                        expect(data['passphrase']).toEqual(passphrase)
                    }
                }
            }
        })

        let address = wrapper.vm.wallet.address
        let mnemonic = wrapper.vm.mnemonic
        wrapper.vm.recoverMnemonic = mnemonic
        await wrapper.vm.recoverFromMnemonic()
        expect(wrapper.vm.wallet.address).toEqual(address)
    })
})