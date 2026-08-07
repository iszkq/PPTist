# WPS 演示适配

WPS 演示通过 `KWPP.Application.COMAddIns` 自动加载 `PPTist.HostAddin`。后台运行器启动后会持续检测已打开的 WPS 演示程序并请求加载插件。

安装器同时注册 32 位和 64 位 COM 宿主，避免常见的“Office x64 + WPS x86”位数不匹配。不同 WPS 版本的功能区兼容性存在差异；放映覆盖层和原生动画保留逻辑不受影响。
