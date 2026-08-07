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
            StatusText.Text = "安装完成。请按说明在 PowerPoint 中上传 manifest.xml。";
            MessageBox.Show("PPTist 放映组件安装完成。\n\n请打开“PowerPoint-启用说明.txt”，按步骤上传 manifest.xml。", "PPTist 安装完成", MessageBoxButton.OK, MessageBoxImage.Information);
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
