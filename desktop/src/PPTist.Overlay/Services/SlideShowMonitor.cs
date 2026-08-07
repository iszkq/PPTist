using PPTist.Overlay.Models;
using System.Runtime.InteropServices;
using System.Windows.Threading;

namespace PPTist.Overlay.Services;

public sealed class SlideShowMonitor : IDisposable
{
    // COM automation happens on the WPF STA thread. A modest polling interval keeps
    // the overlay in step with slide changes without making native slide-show UI lag.
    private readonly DispatcherTimer _timer = new() { Interval = TimeSpan.FromMilliseconds(350) };
    private SlideState? _lastState;
    public event EventHandler<SlideState>? SlideChanged;
    public event EventHandler? SlideShowEnded;

    public SlideShowMonitor()
    {
        _timer.Tick += (_, _) => Poll();
    }

    public void Start() => _timer.Start();

    private void Poll()
    {
        var current = TryGetSlide("PowerPoint.Application", "office") ?? TryGetSlide("KWPP.Application", "wps");
        if (current is null)
        {
            if (_lastState is not null) SlideShowEnded?.Invoke(this, EventArgs.Empty);
            _lastState = null;
            return;
        }
        if (_lastState != current)
        {
            _lastState = current;
            SlideChanged?.Invoke(this, current);
        }
    }

    private static SlideState? TryGetSlide(string programId, string host)
    {
        try
        {
            var appType = Type.GetTypeFromProgID(programId);
            if (appType is null) return null;
            dynamic app = GetActiveComObject(appType);
            if ((int)app.SlideShowWindows.Count < 1) return null;
            dynamic slideshow = app.SlideShowWindows[1];
            dynamic slide = slideshow.View.Slide;
            dynamic presentation = slideshow.Presentation;
            var handle = new IntPtr((int)slideshow.HWND);
            if (!NativeWindow.TryGetBounds(handle, out var bounds)) return null;
            var key = (string?)presentation.FullName ?? (string?)presentation.Name ?? "untitled";
            return new SlideState(host, key, (int)slide.SlideIndex, bounds.Left, bounds.Top, bounds.Width, bounds.Height);
        }
        catch { return null; }
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

    public void Dispose() => _timer.Stop();
}
