import moment from 'moment'

export default {
    equalsHex: (a, b) => {
        let _a = a.toLowerCase()
        if (_a && !_a.startsWith('0x')) {
            _a = '0x' + _a
        }
        let _b = b.toLowerCase()
        if (_b && !_b.startsWith('0x')) {
            _b = '0x' + _b
        }

        return (_a || _b) && _a === _b
    },
    timeFormat(ts) {
        return moment(ts).format('ll, LT')
    },
    shortAddress(address, left = 4, right = 4) {
        return address.substr(0, left + 2)
            + '..'
            + address.substr(address.length - right, right)
    }
}