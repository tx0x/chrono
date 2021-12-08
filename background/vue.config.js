module.exports = {
  publicPath: process.argv[4] == 'localhost' ? 'http://localhost:8002/' : '/background/',
  outputDir: `../build/background`,
  devServer: {
    disableHostCheck: true
  },
}
