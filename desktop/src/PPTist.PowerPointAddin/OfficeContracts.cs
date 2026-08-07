using System;
using System.Runtime.InteropServices;

namespace PPTist.PowerPointAddin;

public enum ext_ConnectMode { ext_cm_AfterStartup = 0, ext_cm_Startup = 1, ext_cm_External = 2, ext_cm_CommandLine = 3 }
public enum ext_DisconnectMode { ext_dm_HostShutdown = 0, ext_dm_UserClosed = 1, ext_dm_UISetupComplete = 2, ext_dm_LanguageChanged = 3, ext_dm_External = 4 }

[ComVisible(true)]
[Guid("B65AD801-ABAF-11D0-BB8B-00A0C90F2744")]
[InterfaceType(ComInterfaceType.InterfaceIsDual)]
public interface IDTExtensibility2
{
    void OnConnection(object application, ext_ConnectMode connectMode, object addInInst, [In, Out] ref Array custom);
    void OnDisconnection(ext_DisconnectMode removeMode, [In, Out] ref Array custom);
    void OnAddInsUpdate([In, Out] ref Array custom);
    void OnStartupComplete([In, Out] ref Array custom);
    void OnBeginShutdown([In, Out] ref Array custom);
}

[ComVisible(true)]
[Guid("000C0396-0000-0000-C000-000000000046")]
[InterfaceType(ComInterfaceType.InterfaceIsDual)]
public interface IRibbonExtensibility
{
    string GetCustomUI(string ribbonId);
}
