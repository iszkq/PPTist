using Microsoft.Web.WebView2.Core;
using PPTist.Overlay.Models;
using System.Runtime.InteropServices;
using System.Text.Json;
using System.Windows;
using System.Windows.Interop;

namespace PPTist.Overlay;

public partial class OverlayWindow : Window
{
    private IReadOnlyList<WidgetDefinition> _widgets = [];
    private const int WmNcHitTest = 0x0084;
    private const int HtTransparent = -1;

    public OverlayWindow()
    {
        InitializeComponent();
        SourceInitialized += (_, _) => HwndSource.FromHwnd(new WindowInteropHelper(this).Handle)?.AddHook(WindowProc);
    }

    public async Task InitializeAsync()
    {
        await Browser.EnsureCoreWebView2Async();
        Browser.DefaultBackgroundColor = System.Drawing.Color.Transparent;
        Browser.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
        Browser.CoreWebView2.Settings.AreDevToolsEnabled = false;
        Browser.NavigateToString("<html><body style='margin:0;background:transparent'></body></html>");
    }

    public void ShowForSlide(SlideState slide, IReadOnlyList<WidgetDefinition> widgets)
    {
        _widgets = widgets;
        Left = slide.Left;
        Top = slide.Top;
        Width = slide.Width;
        Height = slide.Height;
        if (!IsVisible) Show();
        Browser.NavigateToString(CreateDocument(widgets));
    }

    public void HideOverlay()
    {
        _widgets = [];
        if (IsVisible) Hide();
    }

    private static string CreateDocument(IReadOnlyList<WidgetDefinition> widgets)
    {
        var payload = JsonSerializer.Serialize(widgets);
        return $$"""
<!doctype html><html><head><meta charset="utf-8"><style>
html,body,#root{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}.widget{position:absolute;overflow:hidden}.widget iframe{width:100%;height:100%;border:0;background:transparent}
</style></head><body><div id="root"></div><script>
const widgets={{payload}};const root=document.querySelector('#root');
for(const item of widgets){const box=document.createElement('div');box.className='widget';Object.assign(box.style,{left:item.Left/1000*100+'%',top:item.Top/562.5*100+'%',width:item.Width/1000*100+'%',height:item.Height/562.5*100+'%'});const frame=document.createElement('iframe');if(item.EmbedUrl)frame.src=item.EmbedUrl;else frame.srcdoc=`<!doctype html><html><head><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}*{box-sizing:border-box}${item.Css}</style></head><body>${item.Html}<script>${item.JavaScript.replace(/<\\/script/gi,'<\\\\/script')}<\/script></body></html>`;box.appendChild(frame);root.appendChild(box)}
</script></body></html>
""";
    }

    private IntPtr WindowProc(IntPtr hwnd, int message, IntPtr wParam, IntPtr lParam, ref bool handled)
    {
        if (message != WmNcHitTest) return IntPtr.Zero;
        var point = new Point((short)(lParam.ToInt64() & 0xffff) - Left, (short)((lParam.ToInt64() >> 16) & 0xffff) - Top);
        var canHitWidget = _widgets.Any(widget => point.X >= widget.Left / 1000 * ActualWidth && point.X <= (widget.Left + widget.Width) / 1000 * ActualWidth && point.Y >= widget.Top / 562.5 * ActualHeight && point.Y <= (widget.Top + widget.Height) / 562.5 * ActualHeight);
        if (!canHitWidget) { handled = true; return new IntPtr(HtTransparent); }
        return IntPtr.Zero;
    }
}
