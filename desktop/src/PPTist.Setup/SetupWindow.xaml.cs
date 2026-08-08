using System.Windows;

namespace PPTist.Setup;

public partial class SetupWindow : Window
{
    public SetupWindow() => InitializeComponent();

    public async Task InstallAsync()
    {
        try
        {
            var installer = new SetupEngine(message => Dispatcher.Invoke(() => StatusText.Text = message));
            await Task.Run(installer.Install);
            Progress.IsIndeterminate = false;
            Progress.Value = 100;
            StatusText.Text = "安装完成。请在 PowerPoint 的“加载项”中上传 manifest.xml。";
            MessageBox.Show("PPTist 本地放映组件安装完成。\n\n请完全退出并重新打开 PowerPoint，然后点击“开始”选项卡最右侧的“加载项”，上传 manifest.xml。", "PPTist 安装完成", MessageBoxButton.OK, MessageBoxImage.Information);
            Close();
        }
        catch (Exception exception)
        {
            Progress.IsIndeterminate = false;
            StatusText.Text = "安装失败：" + exception.Message;
            MessageBox.Show("安装失败：\n" + exception.Message, "PPTist 安装程序", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }
}
