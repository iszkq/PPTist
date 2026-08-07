using PPTist.Overlay.Models;
using PPTist.Overlay.Services;
using System.IO;
using System.Windows;

namespace PPTist.Overlay;

public partial class App : Application
{
    private readonly WidgetStore _widgetStore = new();
    private readonly SlideShowMonitor _slideShowMonitor = new();
    private readonly HostAddinActivator _hostAddinActivator = new();
    private LocalBridgeServer? _bridgeServer;
    private OverlayWindow? _overlay;
    private SlideState? _currentSlide;

    private async void OnStartup(object sender, StartupEventArgs e)
    {
        _bridgeServer = new LocalBridgeServer(_widgetStore);
        _bridgeServer.WidgetsChanged += (_, _) => RenderCurrentSlide();
        _bridgeServer.Start();

        try
        {
            _overlay = new OverlayWindow();
            await _overlay.InitializeAsync();
        }
        catch (Exception exception)
        {
            var folder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PPTistPlugin");
            Directory.CreateDirectory(folder);
            File.WriteAllText(Path.Combine(folder, "overlay-error.log"), exception.ToString());
        }

        _slideShowMonitor.SlideChanged += (_, slide) =>
        {
            _currentSlide = slide;
            Dispatcher.Invoke(RenderCurrentSlide);
        };
        _slideShowMonitor.SlideShowEnded += (_, _) => Dispatcher.Invoke(() =>
        {
            _currentSlide = null;
            _overlay?.HideOverlay();
        });
        _slideShowMonitor.Start();
        _hostAddinActivator.Start();
    }

    private void RenderCurrentSlide()
    {
        if (_overlay is null || _currentSlide is null) return;
        var widgets = _widgetStore.GetForSlide(_currentSlide.PresentationKey, _currentSlide.SlideIndex);
        _overlay.ShowForSlide(_currentSlide, widgets);
    }

    private void OnExit(object sender, ExitEventArgs e)
    {
        _slideShowMonitor.Dispose();
        _hostAddinActivator.Dispose();
        _bridgeServer?.Dispose();
    }
}
