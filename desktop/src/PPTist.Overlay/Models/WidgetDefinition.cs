namespace PPTist.Overlay.Models;

public sealed class WidgetDefinition
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = "HTML 动效";
    public string PresentationKey { get; set; } = string.Empty;
    public int SlideIndex { get; set; }
    public double Left { get; set; }
    public double Top { get; set; }
    public double Width { get; set; } = 320;
    public double Height { get; set; } = 180;
    public string Html { get; set; } = string.Empty;
    public string Css { get; set; } = string.Empty;
    public string JavaScript { get; set; } = string.Empty;
    public string? EmbedUrl { get; set; }
}

public sealed record SlideState(string Host, string PresentationKey, int SlideIndex, int Left, int Top, int Width, int Height);
