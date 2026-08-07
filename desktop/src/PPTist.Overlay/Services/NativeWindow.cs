using System.Runtime.InteropServices;

namespace PPTist.Overlay.Services;

public static class NativeWindow
{
    [DllImport("user32.dll")]
    private static extern bool GetWindowRect(IntPtr hWnd, out Rect rect);

    public static bool TryGetBounds(IntPtr handle, out WindowBounds bounds)
    {
        bounds = default;
        if (handle == IntPtr.Zero || !GetWindowRect(handle, out var rect)) return false;
        bounds = new WindowBounds(rect.Left, rect.Top, rect.Right - rect.Left, rect.Bottom - rect.Top);
        return bounds.Width > 0 && bounds.Height > 0;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct Rect { public int Left; public int Top; public int Right; public int Bottom; }
}

public readonly record struct WindowBounds(int Left, int Top, int Width, int Height);
