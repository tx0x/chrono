/**
 * @jest-environment jsdom
 */
import {createLocalVue, mount} from '@vue/test-utils'
import Login from "@/views/Login.vue"
import Vuetify from "vuetify";
const localVue = createLocalVue()

describe("Login", () => {
    test("check login", async () => {
        const wrapper = mount(Login, {
            localVue,
            vuetify: new Vuetify(),
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

        expect(wrapper.vm.loginError).toBeNull()
        await wrapper.vm.login()
        expect(wrapper.vm.loginError).toEqual('invalid password')
        await wrapper.setData({
            password: '12345678'
        })
        await wrapper.find('.login-btn').trigger('click')
        expect(wrapper.vm.loginError).toBeNull()
    })
})