using System.Runtime.InteropServices;
using System.Windows.Threading;

namespace PPTist.Overlay.Services;

/// <summary>
/// WPS does not use the same stable registry contract as Microsoft Office.
/// When WPS is running, ask its COM automation layer to load the common add-in.
/// The operation is idempotent and failures are intentionally ignored so normal
/// WPS editing and slide-show work is never blocked.
/// </summary>
public sealed class HostAddinActivator : IDisposable
{
    private readonly DispatcherTimer _timer = new() { Interval = TimeSpan.FromSeconds(2) };

    public HostAddinActivator() => _timer.Tick += (_, _) => EnableWpsAddin();
    public void Start() => _timer.Start();
    public void Dispose() => _timer.Stop();

    private static void EnableWpsAddin()
    {
        try
        {
            var appType = Type.GetTypeFromProgID("KWPP.Application");
            if (appType is null) return;
            dynamic app = GetActiveComObject(appType);
            dynamic addins = app.COMAddIns;
            dynamic? target = null;
            foreach (dynamic addin in addins)
            {
                if (string.Equals((string?)addin.ProgId, "PPTist.HostAddin", StringComparison.OrdinalIgnoreCase))
                {
                    target = addin;
                    break;
                }
            }
            target ??= addins.Add("PPTist.HostAddin");
            target.Connect = true;
        }
        catch { }
    }

    private static object GetActiveComObject(Type appType)
    {
        var classId = appType.GUID;
        var result = GetActiveObject(ref classId, IntPtr.Zero, out var instance);
        Marshal.ThrowExceptionForHR(result);
        return instance;
    }

    [DllImport("oleaut32.dll", PreserveSig = true)]
    private static extern int GetActiveObject(ref Guid classId, IntPtr reserved, [MarshalAs(UnmanagedType.IUnknown)] out object instance);
}
