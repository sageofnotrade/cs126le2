const path = require('path');

module.exports = {
  entry: {
    main: './src/index.js',
    categories: './src/categories.js'
  },
  output: {
    path: path.resolve(__dirname, 'static', 'frontend'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
}; 