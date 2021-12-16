export default {
    mockChrome() {
        global.chrome = {
            runtime: {
                sendMessage: (data, callback) => {callback({})}
            }
        }
    }
}