using System.Runtime.InteropServices;

namespace PPTist.HostAddin;

[ComImport]
[Guid("B65AD801-ABAF-11D0-BB8B-00A0C90F2744")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IDTExtensibility2
{
    void OnConnection([MarshalAs(UnmanagedType.IDispatch)] object application, int connectMode,
        [MarshalAs(UnmanagedType.IDispatch)] object addInInst, ref Array custom);
    void OnDisconnection(int removeMode, ref Array custom);
    void OnAddInsUpdate(ref Array custom);
    void OnStartupComplete(ref Array custom);
    void OnBeginShutdown(ref Array custom);
}

[ComImport]
[Guid("000C0396-0000-0000-C000-000000000046")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IRibbonExtensibility
{
    [return: MarshalAs(UnmanagedType.BStr)]
    string GetCustomUI([MarshalAs(UnmanagedType.BStr)] string ribbonId);
}
