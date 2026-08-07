using System.Runtime.InteropServices;
using System.Windows;

namespace PPTist.HostAddin;

[ComVisible(true)]
[Guid("E5707554-F46A-4F29-A918-5FEAD9A8F136")]
[ProgId("PPTist.HostAddin")]
[ClassInterface(ClassInterfaceType.AutoDual)]
public sealed class PPTistAddin : IDTExtensibility2, IRibbonExtensibility
{
    private object? _application;

    public void OnConnection(object application, int connectMode, object addInInst, ref Array custom) => _application = application;
    public void OnDisconnection(int removeMode, ref Array custom) => _application = null;
    public void OnAddInsUpdate(ref Array custom) { }
    public void OnStartupComplete(ref Array custom) { }
    public void OnBeginShutdown(ref Array custom) { }

    public string GetCustomUI(string ribbonId) => """
      <customUI xmlns="http://schemas.microsoft.com/office/2009/07/customui">
        <ribbon><tabs><tab id="pptistTab" label="PPTist 动效">
          <group id="pptistWidgets" label="HTML 动效">
            <button id="pptistStudio" label="插入或编辑动效" size="large" imageMso="HappyFace" onAction="OpenStudio" screentip="PPTist HTML 动效" supertip="为当前幻灯片添加转盘、粒子或自定义 HTML 动效。"/>
          </group>
        </tab></tabs></ribbon>
      </customUI>
      """;

    [DispId(1)]
    public void OpenStudio(object control)
    {
        if (_application is null)
        {
            MessageBox.Show("未找到当前演示文稿。请先打开一个 PowerPoint 或 WPS 演示文件。", "PPTist 动效");
            return;
        }

        if (Application.Current is null) _ = new Application { ShutdownMode = ShutdownMode.OnExplicitShutdown };
        var studio = new WidgetStudioWindow(_application);
        studio.ShowDialog();
    }
}
