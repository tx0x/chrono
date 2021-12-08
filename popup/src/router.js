import Vue from 'vue'
import Router from 'vue-router'
import Index from '@/views/Index'
import Initiate from "@/views/Initiate";
import InitiateMnemonic from "@/views/InitiateMnemonic";
import Login from "@/views/Login";
import ForgotPassword from "@/views/ForgotPassword";
import Send from "@/views/Send";
import BridgeWNCG from "@/views/BridgeWNCG";
import Bridge from "@/views/Bridge";

Vue.use(Router)
let router = new Router({
    base: process.env.BASE_URL,
    routes: [
        {
            path: '/',
            name: 'index',
            component: Index
        },
        {
            path: '/login',
            name: 'login',
            component: Login
        },
        {
            path: '/initiate',
            name: 'initiate',
            component: Initiate
        },
        {
            path: '/initiate-mnemonic',
            name: 'initiateMnemonic',
            component: InitiateMnemonic
        },
        {
            path: '/forgot-password',
            name: 'forgotPassword',
            component: ForgotPassword
        },
        {
            path: '/send',
            name: 'send',
            component: Send
        },
        {
            path: '/bridge',
            name: 'bridge',
            component: Bridge
        },
        {
            path: '/bridge/ncg2wncg',
            name: 'ncg2wncg',
            component: BridgeWNCG
        }

    ]
})

export default router
