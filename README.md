# dw_ladder

简单方便的proxy浏览墙外信息工具。

### Chrome Extension

本项目基于SwitchyOmega开源项目二次开发的chrome extension应用。
可以通过离线文件（.crx）进行chrome 扩展用应用安装。下载地址：[Releases page]()

### Build the project
```javascript
 # Install node and npm first (make sure npm --version > 2.0), then:

sudo npm install -g grunt-cli@1.2.0 bower
# In the project folder:
cd omega-build
npm run deps # This runs npm install in every module.
npm run dev # This runs npm link to aid local development.
# Note: the previous command may require sudo in some environments.
# The modules are now working. We can build now:
grunt
# After building, a folder will be generated:
cd .. # Return to project root.
ls omega-chromium-extension/build/
# The folder above can be loaded as an unpacked extension in Chromium now.
```


