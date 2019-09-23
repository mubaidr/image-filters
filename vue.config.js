const webpack = require('webpack')

module.exports = {
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        'process.browser': 'true'
      })
    ]
  }
}
