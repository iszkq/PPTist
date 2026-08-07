using PPTist.Overlay.Models;
using System.IO;
using System.Text.Json;

namespace PPTist.Overlay.Services;

public sealed class WidgetStore
{
    private readonly string _filePath;
    private readonly object _lock = new();
    private List<WidgetDefinition> _widgets = [];

    public WidgetStore()
    {
        var folder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PPTistPlugin");
        Directory.CreateDirectory(folder);
        _filePath = Path.Combine(folder, "widgets.json");
        Load();
    }

    public IReadOnlyList<WidgetDefinition> GetForSlide(string presentationKey, int slideIndex)
    {
        lock (_lock)
        {
            return _widgets.Where(item => string.Equals(item.PresentationKey, presentationKey, StringComparison.OrdinalIgnoreCase) && item.SlideIndex == slideIndex).ToList();
        }
    }

    public void ReplaceForPresentation(string presentationKey, IEnumerable<WidgetDefinition> widgets)
    {
        lock (_lock)
        {
            _widgets.RemoveAll(item => string.Equals(item.PresentationKey, presentationKey, StringComparison.OrdinalIgnoreCase));
            _widgets.AddRange(widgets.Select(item => { item.PresentationKey = presentationKey; return item; }));
            Save();
        }
    }

    private void Load()
    {
        if (!File.Exists(_filePath)) return;
        try { _widgets = JsonSerializer.Deserialize<List<WidgetDefinition>>(File.ReadAllText(_filePath)) ?? []; }
        catch { _widgets = []; }
    }

    private void Save() => File.WriteAllText(_filePath, JsonSerializer.Serialize(_widgets, new JsonSerializerOptions { WriteIndented = true }));
}
