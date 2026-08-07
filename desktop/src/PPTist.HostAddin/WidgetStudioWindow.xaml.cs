using PPTist.Overlay.Models;
using PPTist.Overlay.Services;
using System.Windows;
using System.Windows.Controls;

namespace PPTist.HostAddin;

public partial class WidgetStudioWindow : Window
{
    private readonly WidgetStore _store = new();
    private readonly string _presentationKey;
    private readonly int _slideIndex;
    private WidgetDefinition? _editing;

    public WidgetStudioWindow(object application)
    {
        InitializeComponent();
        try
        {
            dynamic app = application;
            dynamic presentation = app.ActivePresentation;
            dynamic slide = app.ActiveWindow.View.Slide;
            _presentationKey = (string?)presentation.FullName ?? (string?)presentation.Name ?? "untitled";
            _slideIndex = (int)slide.SlideIndex;
        }
        catch (Exception exception)
        {
            throw new InvalidOperationException("无法读取当前演示文稿或幻灯片。请在普通编辑视图中打开演示文件后重试。", exception);
        }

        DocumentInfo.Text = $"当前文件：{_presentationKey}\n当前页：{_slideIndex}";
        RefreshList();
        Load(TemplateCatalog.Create("自定义 HTML"));
    }

    private void RefreshList()
    {
        WidgetList.ItemsSource = _store.GetForSlide(_presentationKey, _slideIndex).ToList();
    }

    private void OnTemplateChanged(object sender, SelectionChangedEventArgs e)
    {
        if (!IsLoaded || TemplateBox.SelectedItem is not ComboBoxItem item) return;
        _editing = null;
        Load(TemplateCatalog.Create(item.Content.ToString() ?? "自定义 HTML"));
    }

    private void OnWidgetSelected(object sender, SelectionChangedEventArgs e)
    {
        if (WidgetList.SelectedItem is WidgetDefinition widget)
        {
            _editing = widget;
            Load(widget);
        }
    }

    private void OnNew(object sender, RoutedEventArgs e)
    {
        _editing = null;
        WidgetList.SelectedItem = null;
        Load(TemplateCatalog.Create("自定义 HTML"));
    }

    private void OnDelete(object sender, RoutedEventArgs e)
    {
        if (_editing is null) return;
        _store.Delete(_presentationKey, _slideIndex, _editing.Id);
        OnNew(sender, e);
        RefreshList();
    }

    private void OnSave(object sender, RoutedEventArgs e)
    {
        var widget = _editing ?? new WidgetDefinition();
        widget.PresentationKey = _presentationKey;
        widget.SlideIndex = _slideIndex;
        widget.Left = Number(LeftBox, 340);
        widget.Top = Number(TopBox, 170);
        widget.Width = Number(WidthBox, 320);
        widget.Height = Number(HeightBox, 220);
        widget.Html = HtmlBox.Text;
        widget.Css = CssBox.Text;
        widget.JavaScript = JavaScriptBox.Text;
        widget.Id = string.IsNullOrWhiteSpace(NameBox.Text) ? widget.Id : NameBox.Text.Trim();
        _store.Upsert(widget);
        _editing = widget;
        RefreshList();
        MessageBox.Show("已保存。进入该页放映时将自动显示此动效。", "PPTist 动效", MessageBoxButton.OK, MessageBoxImage.Information);
    }

    private void Load(WidgetDefinition widget)
    {
        NameBox.Text = widget.Id;
        LeftBox.Text = widget.Left.ToString("0.##");
        TopBox.Text = widget.Top.ToString("0.##");
        WidthBox.Text = widget.Width.ToString("0.##");
        HeightBox.Text = widget.Height.ToString("0.##");
        HtmlBox.Text = widget.Html;
        CssBox.Text = widget.Css;
        JavaScriptBox.Text = widget.JavaScript;
    }

    private static double Number(TextBox box, double fallback) => double.TryParse(box.Text, out var value) && value >= 0 ? value : fallback;
}
