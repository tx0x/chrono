export default {
    required: value => value != null && value.length > 0 || 'Required.',
    min8Len: v => v.length >= 8 || 'Min 8 characters',
    canNotZero: v => v > 0 || 'Can not be zero',
    ncgAmount: v => Number(v) > 0 && Number(Number(v).toFixed(2)) === Number(v) || 'Invalid Amount Format',
    address: v => v.length == 42 && v.match(/^0[xX][0-9a-fA-F]{40}$/) != null || 'Invalid Address',
}