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
            StatusText.Text = "安装完成。请重新打开 PowerPoint 或 WPS，然后在功能区找到“PPTist 动效”。";
            MessageBox.Show("PPTist 动效插件安装完成。\n\n请完全退出后重新打开 PowerPoint 或 WPS。", "PPTist 安装完成", MessageBoxButton.OK, MessageBoxImage.Information);
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
