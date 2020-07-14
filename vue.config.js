module.exports = {
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: "com.colehollant.stickycal",
        productName: "Sticky Cal",
        copyright: "Copyright © 2020 Cole Hollant",
        mac: {
          target: "zip"
        }
      }
    }
  }
}