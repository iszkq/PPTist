using System.Windows;

namespace PPTist.Setup;

public partial class App : Application
{
    private async void OnStartup(object sender, StartupEventArgs e)
    {
        var window = new SetupWindow();
        MainWindow = window;
        window.Show();
        await window.InstallAsync();
    }
}
