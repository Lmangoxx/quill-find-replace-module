var path = require('path');
// var webpack = require('webpack');

module.exports = {
  watch: true,
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, './dist'),
    library: 'QuillFindReplace',
    libraryTarget: 'umd',
    filename: "quill-find-replace.min.js"
  },
  externals: {
    'quill': 'Quill'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: path.join(__dirname, 'src'),
        exclude: /(node_modules|bower_components)/,
        use: 'ts-loader'
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          'less-loader',
        ],
      }
    ]
  }
  // plugins: [
  //   new webpack.optimize.UglifyJsPlugin({
  //     compress: { //压缩代码
  //       dead_code: true, //移除没被引用的代码
  //       warnings: false, //当删除没有用处的代码时，显示警告
  //       loops: true //当do、while 、 for循环的判断条件可以确定是，对其进行优化
  //     },
  //     except: ['$super', '$', 'exports', 'require']
  //   })
  // ]
};
