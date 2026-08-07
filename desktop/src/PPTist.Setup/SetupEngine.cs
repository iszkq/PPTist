using Microsoft.Win32;
using System.Diagnostics;
using System.IO;
using System.Reflection;

namespace PPTist.Setup;

/// Installs the companion overlay and registers an Office Add-in catalog.
/// Nothing from this process is loaded into POWERPNT.EXE.
internal sealed class SetupEngine(Action<string> report)
{
    private static readonly Guid CatalogId = new("2c7d5d7a-2664-4b59-b8d1-37c2cfecf43a");
    private readonly Action<string> _report = report;
    private readonly Assembly _assembly = Assembly.GetExecutingAssembly();
    private readonly string _root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PPTistPlugin");

    public void Install()
    {
        _report("正在关闭旧版 PPTist 放映服务…");
        StopInstalledOverlay();
        _report("正在释放 PPTist 放映组件…");
        ExtractPayload();
        _report("正在配置 PowerPoint 加载项目录…");
        RegisterSharedFolderCatalog();
        WriteInstructions();
        _report("正在启动透明放映覆盖层…");
        EnableStartup();
        StartOverlay();
    }

    private void StopInstalledOverlay()
    {
        var target = Path.GetFullPath(Path.Combine(_root, "runtime", "PPTist.Overlay.exe"));
        foreach (var process in Process.GetProcessesByName("PPTist.Overlay"))
        {
            try
            {
                var executable = process.MainModule?.FileName;
                if (string.IsNullOrWhiteSpace(executable) || !string.Equals(Path.GetFullPath(executable), target, StringComparison.OrdinalIgnoreCase))
                {
                    process.Dispose();
                    continue;
                }

                process.CloseMainWindow();
                if (!process.WaitForExit(2500))
                {
                    process.Kill(entireProcessTree: true);
                    process.WaitForExit(5000);
                }
                if (!process.HasExited) throw new InvalidOperationException("旧版 PPTist 放映服务未能退出。");
            }
            catch (Exception exception) when (exception is not InvalidOperationException)
            {
                throw new InvalidOperationException("无法关闭正在运行的旧版 PPTist 放映服务，请在任务管理器中结束 PPTist.Overlay.exe 后重试。", exception);
            }
            finally
            {
                process.Dispose();
            }
        }
    }

    private void ExtractPayload()
    {
        foreach (var resourceName in _assembly.GetManifestResourceNames().Where(name => name.StartsWith("payload/", StringComparison.Ordinal)))
        {
            var relative = resourceName["payload/".Length..].Replace('/', Path.DirectorySeparatorChar);
            var destination = Path.Combine(_root, relative);
            Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
            using var input = _assembly.GetManifestResourceStream(resourceName) ?? throw new InvalidOperationException("安装包文件损坏：" + resourceName);
            using var output = File.Create(destination);
            input.CopyTo(output);
        }
    }

    private void RegisterSharedFolderCatalog()
    {
        var manifestDirectory = Path.Combine(_root, "office-addin");
        using var key = Registry.CurrentUser.CreateSubKey($@"Software\Microsoft\Office\16.0\WEF\TrustedCatalogs\{CatalogId:B}", true);
        key?.SetValue("Id", CatalogId.ToString("B"));
        key?.SetValue("Url", manifestDirectory);
        key?.SetValue("Flags", 1, RegistryValueKind.DWord);
    }

    private void WriteInstructions()
    {
        var file = Path.Combine(_root, "PowerPoint-启用说明.txt");
        File.WriteAllText(file, "PPTist HTML 动效\r\n\r\n" +
            "1. 完全退出并重新打开 Microsoft PowerPoint。\r\n" +
            "2. 文件 → 获取加载项 → 管理我的加载项 → 上传我的加载项。\r\n" +
            "3. 选择本文件夹中的 office-addin\\manifest.xml。\r\n" +
            "4. 打开任意 PPT/PPTX，在功能区点击“PPTist 动效 → 打开动效面板”。\r\n\r\n" +
            "只支持 Microsoft PowerPoint；本安装包不会向 PowerPoint 注入 COM/.NET 代码。\r\n" +
            "如果看不到上传入口，请在 PowerPoint 的加载项管理页选择“管理我的加载项”。\r\n", System.Text.Encoding.UTF8);
    }

    private void EnableStartup()
    {
        var exe = Path.Combine(_root, "runtime", "PPTist.Overlay.exe");
        using var key = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true);
        key?.SetValue("PPTistOverlay", '"' + exe + '"');
    }

    private void StartOverlay()
    {
        var exe = Path.Combine(_root, "runtime", "PPTist.Overlay.exe");
        if (File.Exists(exe)) Process.Start(new ProcessStartInfo(exe) { UseShellExecute = true, WindowStyle = ProcessWindowStyle.Hidden });
    }
}
