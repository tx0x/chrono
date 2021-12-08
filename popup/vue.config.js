module.exports = {
  publicPath: process.argv[4] == 'localhost' ? 'http://localhost:8001/' : '/popup/',
  outputDir: `../build/popup`,
  devServer: {
    disableHostCheck: true
  },
}
