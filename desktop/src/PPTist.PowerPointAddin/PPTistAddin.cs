using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace PPTist.PowerPointAddin;

[ComVisible(true)]
[Guid("B8CC85F4-0E1B-4C4D-9C31-5361DF0C8AC0")]
[ProgId("PPTist.PowerPointAddin")]
[ClassInterface(ClassInterfaceType.None)]
public sealed class PPTistAddin : IDTExtensibility2, IRibbonExtensibility
{
    private object _application;

    public void OnConnection(object application, ext_ConnectMode connectMode, object addInInst, ref Array custom) => _application = application;
    public void OnDisconnection(ext_DisconnectMode removeMode, ref Array custom) => _application = null;
    public void OnAddInsUpdate(ref Array custom) { }
    public void OnStartupComplete(ref Array custom) { }
    public void OnBeginShutdown(ref Array custom) { }

    public string GetCustomUI(string ribbonId) => @"
<customUI xmlns='http://schemas.microsoft.com/office/2009/07/customui'>
  <ribbon><tabs><tab id='pptistTab' label='PPTist 动效'>
    <group id='pptistWidgets' label='HTML 动效'>
      <button id='pptistStudio' label='打开动效面板' size='large' imageMso='AnimationCustom' onAction='OpenStudio' screentip='PPTist HTML 动效' supertip='添加和编辑透明 HTML 动效。'/>
    </group>
  </tab></tabs></ribbon>
</customUI>";

    public void OpenStudio(object control)
    {
        if (_application == null) { MessageBox.Show("请先打开一个 PowerPoint 演示文稿。", "PPTist 动效"); return; }
        try { using (var studio = new StudioForm(_application)) studio.ShowDialog(); }
        catch (Exception exception) { MessageBox.Show(exception.Message, "PPTist 动效"); }
    }
}
