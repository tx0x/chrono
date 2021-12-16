/**
 * @jest-environment jsdom
 */
import { mount } from '@vue/test-utils'
import ForgotPassword from "@/views/ForgotPassword.vue"

describe("ForgotPassword", () => {
    test("redirect initiate page when clicked forgot password", async () => {
        let clicked = false
        const wrapper = mount(ForgotPassword, {
            mocks: {
                $router: {
                    replace: async ({name, query}) => {
                        expect(name).toEqual('initiate')
                        expect(query['mode']).toEqual('recover')
                        clicked = true
                    }
                }
            }
        })
        await wrapper.find('.point-btn').trigger('click')
        expect(clicked).toBeTruthy()
    })
})