using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Web.Script.Serialization;
using System.Windows.Forms;

namespace PPTist.PowerPointAddin;

internal sealed class WidgetRecord
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = "HTML 动效";
    public string PresentationKey { get; set; }
    public int SlideIndex { get; set; }
    public double Left { get; set; } = 340;
    public double Top { get; set; } = 130;
    public double Width { get; set; } = 320;
    public double Height { get; set; } = 260;
    public string Html { get; set; } = "<div>编辑你的 HTML 动效</div>";
    public string Css { get; set; } = "div{color:#fff;text-align:center;font-size:24px;padding:60px}";
    public string JavaScript { get; set; } = "";
    public string EmbedUrl { get; set; }
}

internal sealed class StudioForm : Form
{
    private readonly string _presentationKey;
    private readonly int _slideIndex;
    private readonly List<WidgetRecord> _all;
    private readonly TextBox _name = new(), _left = new(), _top = new(), _width = new(), _height = new(), _html = new(), _css = new(), _js = new();
    private readonly ListBox _list = new();
    private readonly JavaScriptSerializer _json = new();
    private WidgetRecord _editing;

    public StudioForm(object application)
    {
        dynamic app = application;
        dynamic presentation = app.ActivePresentation;
        dynamic slide = app.ActiveWindow.View.Slide;
        _presentationKey = (string)presentation.FullName;
        _slideIndex = (int)slide.SlideIndex;
        _all = LoadWidgets();
        Text = "PPTist HTML 动效"; Width = 940; Height = 720; StartPosition = FormStartPosition.CenterScreen;
        BuildControls(); RefreshList(); NewWidget();
    }

    private void BuildControls()
    {
        var split = new SplitContainer { Dock = DockStyle.Fill, SplitterDistance = 220, Padding = new Padding(10) }; Controls.Add(split);
        _list.Dock = DockStyle.Fill; _list.SelectedIndexChanged += (_, __) => { if (_list.SelectedItem is WidgetRecord w) LoadWidget(w); }; split.Panel1.Controls.Add(_list);
        var top = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 38 };
        var fresh = new Button { Text = "新建动效", AutoSize = true }; fresh.Click += (_, __) => NewWidget();
        var template = new ComboBox { Width = 130, DropDownStyle = ComboBoxStyle.DropDownList }; template.Items.AddRange(new object[] { "自定义 HTML", "幸运转盘", "雨滴照片", "萤火虫" }); template.SelectedIndex = 0; template.SelectedIndexChanged += (_, __) => ApplyTemplate(template.SelectedItem.ToString());
        top.Controls.Add(fresh); top.Controls.Add(template); split.Panel2.Controls.Add(top);
        var info = new Label { Dock = DockStyle.Top, Height = 42, Text = "当前文件：" + _presentationKey + "\r\n当前页：" + _slideIndex, AutoEllipsis = true }; split.Panel2.Controls.Add(info);
        var grid = new TableLayoutPanel { Dock = DockStyle.Top, Height = 70, ColumnCount = 5, RowCount = 2 }; for (var i = 0; i < 5; i++) grid.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 20));
        AddField(grid, "名称", _name, 0, 0); AddField(grid, "左", _left, 1, 0); AddField(grid, "上", _top, 2, 0); AddField(grid, "宽", _width, 3, 0); AddField(grid, "高", _height, 4, 0); split.Panel2.Controls.Add(grid);
        AddCode(split.Panel2, "HTML", _html); AddCode(split.Panel2, "CSS", _css); AddCode(split.Panel2, "JavaScript", _js);
        var actions = new FlowLayoutPanel { Dock = DockStyle.Bottom, Height = 45, FlowDirection = FlowDirection.RightToLeft };
        var save = new Button { Text = "保存到当前 PPT", AutoSize = true }; save.Click += (_, __) => SaveWidget();
        var remove = new Button { Text = "删除", AutoSize = true }; remove.Click += (_, __) => DeleteWidget(); actions.Controls.Add(save); actions.Controls.Add(remove); split.Panel2.Controls.Add(actions);
    }

    private static void AddField(TableLayoutPanel panel, string label, TextBox box, int column, int row) { var holder = new Panel { Dock = DockStyle.Fill }; holder.Controls.Add(new Label { Text = label, Dock = DockStyle.Top }); box.Dock = DockStyle.Bottom; holder.Controls.Add(box); panel.Controls.Add(holder, column, row); }
    private static void AddCode(Control parent, string label, TextBox box) { var holder = new Panel { Dock = DockStyle.Top, Height = 130 }; holder.Controls.Add(new Label { Text = label, Dock = DockStyle.Top }); box.Multiline = true; box.ScrollBars = ScrollBars.Both; box.Font = new Font("Consolas", 9); box.Dock = DockStyle.Fill; holder.Controls.Add(box); parent.Controls.Add(holder); }
    private void NewWidget() { _editing = new WidgetRecord { PresentationKey = _presentationKey, SlideIndex = _slideIndex }; LoadWidget(_editing); _list.ClearSelected(); }
    private void LoadWidget(WidgetRecord w) { _editing = w; _name.Text = w.Name; _left.Text = w.Left.ToString("0.##"); _top.Text = w.Top.ToString("0.##"); _width.Text = w.Width.ToString("0.##"); _height.Text = w.Height.ToString("0.##"); _html.Text = w.Html; _css.Text = w.Css; _js.Text = w.JavaScript; }
    private void ApplyTemplate(string name) { if (_editing == null || name == "自定义 HTML") return; if (name == "幸运转盘") { _html.Text = "<div id='wheel'></div><button id='spin'>开始</button><div id='result'></div>"; _css.Text = "#wheel{width:220px;height:220px;border-radius:50%;background:conic-gradient(#ef4444 0 90deg,#f59e0b 90deg 180deg,#10b981 180deg 270deg,#3b82f6 270deg);transition:transform 3s}#spin{margin:10px}"; _js.Text = "let a=0;spin.onclick=()=>{a+=1440+Math.random()*360;wheel.style.transform='rotate('+a+'deg)';setTimeout(()=>result.textContent='抽中完成',3000)}"; } else if (name == "雨滴照片") { _html.Text = "<div class='rain'><b>照片 1</b><b>照片 2</b><b>照片 3</b></div>"; _css.Text = ".rain{height:220px;position:relative;overflow:hidden}.rain b{position:absolute;top:-50px;padding:20px;background:#fff;color:#111;animation:fall 5s infinite}.rain b:nth-child(1){left:10%}.rain b:nth-child(2){left:45%;animation-delay:1.5s}.rain b:nth-child(3){left:75%;animation-delay:3s}@keyframes fall{to{transform:translateY(300px);opacity:.1}}"; } else { _html.Text = "<div class='fireflies'><i></i><i></i><i></i><i></i></div>"; _css.Text = ".fireflies{height:220px;background:#061b2b;position:relative}.fireflies i{position:absolute;width:8px;height:8px;border-radius:50%;background:#fde68a;box-shadow:0 0 20px 8px #facc15;animation:f 4s infinite}.fireflies i:nth-child(1){left:20%;top:40%}.fireflies i:nth-child(2){left:50%;top:70%;animation-delay:-1s}.fireflies i:nth-child(3){left:75%;top:25%;animation-delay:-2s}@keyframes f{50%{transform:translate(25px,-30px);opacity:.5}}"; } }
    private void SaveWidget() { _editing.Name = string.IsNullOrWhiteSpace(_name.Text) ? "HTML 动效" : _name.Text.Trim(); _editing.Left = Number(_left, 340); _editing.Top = Number(_top, 130); _editing.Width = Number(_width, 320); _editing.Height = Number(_height, 260); _editing.Html = _html.Text; _editing.Css = _css.Text; _editing.JavaScript = _js.Text; if (!_all.Any(w => w.Id == _editing.Id)) _all.Add(_editing); SaveWidgets(); RefreshList(); MessageBox.Show("已保存，按 F5 放映即可看到效果。", "PPTist 动效"); }
    private void DeleteWidget() { if (_editing == null) return; _all.RemoveAll(w => w.Id == _editing.Id); SaveWidgets(); RefreshList(); NewWidget(); }
    private void RefreshList() { _list.Items.Clear(); foreach (var widget in _all.Where(w => w.PresentationKey == _presentationKey && w.SlideIndex == _slideIndex)) _list.Items.Add(widget); }
    private List<WidgetRecord> LoadWidgets() { var file = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PPTistPlugin", "widgets.json"); if (!File.Exists(file)) return new List<WidgetRecord>(); try { return _json.Deserialize<List<WidgetRecord>>(File.ReadAllText(file)) ?? new List<WidgetRecord>(); } catch { return new List<WidgetRecord>(); } }
    private void SaveWidgets() { var folder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PPTistPlugin"); Directory.CreateDirectory(folder); File.WriteAllText(Path.Combine(folder, "widgets.json"), _json.Serialize(_all), Encoding.UTF8); }
    private static double Number(TextBox box, double fallback) { double value; return double.TryParse(box.Text, out value) && value >= 0 ? value : fallback; }
}
