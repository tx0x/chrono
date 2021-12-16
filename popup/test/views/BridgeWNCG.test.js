/**
 * @jest-environment jsdom
 */
import {createLocalVue, mount} from '@vue/test-utils'
import Bridge from "@/views/BridgeWNCG.vue"
import Vuetify from "vuetify";
import Mock from "../mock"
import store from '@/store'
Mock.mockChrome()
const localVue = createLocalVue()

describe("Bridge", () => {
    let account
    beforeAll(() => {
        account = {
            address: '0x48BD02A8ADe581A55743646c8880F307F2e8e79D',
            name: 'Account 1'
        }
        store.commit('Account/setAccounts', [account])
        store.commit('Account/selectAccount', account.address)
    })

    test("check bridge", async () => {
        const wrapper = mount(Bridge, {
            localVue,
            vuetify: new Vuetify(),
            attachTo: '#app > div',
            store,
            mocks: {
                $router: {
                    replace: async ({name, query}) => {
                    }
                },
                $store: {
                    dispatch: async (v) => {
                        return true
                    }
                }
            }
        })

        expect(wrapper.vm.receiver).toBe('')
        expect(wrapper.vm.amount).toBe(0)
        expect(wrapper.vm.nonce).toBe(0)
        expect(wrapper.vm.confirmDialog).toBe(false)
        await wrapper.find('.confirm-btn').trigger('click')
        expect(wrapper.vm.confirmDialog).toBe(false)

        await wrapper.setData({
            receiver: '0x48BD02A8ADe581A55743646c8880F307F2e8e79A',
            amount: '100',
            nonce: 1
        })
        await wrapper.find('.confirm-btn').trigger('click')
        expect(wrapper.vm.confirmDialog).toBe(false)

        await store.commit('Account/setBalance', '100')
        await wrapper.vm.confirmSend()
        expect(wrapper.vm.confirmDialog).toBe(true)

        await wrapper.find('.send-btn').trigger('click')
    })
})