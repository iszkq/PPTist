using Microsoft.Win32;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Reflection;

namespace PPTist.Setup;

internal sealed class SetupEngine(Action<string> report)
{
    private const string ProgId = "PPTist.HostAddin";
    private const string Clsid = "{E5707554-F46A-4F29-A918-5FEAD9A8F136}";
    private readonly Action<string> _report = report;
    private readonly Assembly _assembly = Assembly.GetExecutingAssembly();
    private readonly string _root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PPTistPlugin");

    public void Install()
    {
        _report("正在释放插件文件…");
        ExtractPayload();
        _report("正在安装必要运行环境…");
        EnsureDesktopRuntime("x64");
        EnsureDesktopRuntime("x86");
        _report("正在注册 PowerPoint / WPS 插件…");
        RegisterComAddin(RegistryView.Registry64, Path.Combine(_root, "runtime", "PPTist.HostAddin.comhost.dll"));
        if (Environment.Is64BitOperatingSystem) RegisterComAddin(RegistryView.Registry32, Path.Combine(_root, "addin-x86", "PPTist.HostAddin.comhost.dll"));
        RegisterPowerPoint(RegistryView.Registry64);
        if (Environment.Is64BitOperatingSystem) RegisterPowerPoint(RegistryView.Registry32);
        _report("正在启动放映服务…");
        EnableStartup();
        StartOverlay();
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

    private void EnsureDesktopRuntime(string architecture)
    {
        if (HasDesktopRuntime(architecture)) return;
        var installer = Path.Combine(_root, "dependencies", "windowsdesktop-runtime-" + architecture + ".exe");
        if (!File.Exists(installer)) throw new InvalidOperationException("缺少 .NET 8 Desktop Runtime 安装文件。");
        var process = Process.Start(new ProcessStartInfo(installer, "/install /quiet /norestart") { UseShellExecute = true })
            ?? throw new InvalidOperationException("无法启动 .NET Desktop Runtime 安装程序。");
        process.WaitForExit();
        if (process.ExitCode is not 0 and not 3010) throw new InvalidOperationException(".NET Desktop Runtime 安装失败，错误代码：" + process.ExitCode);
    }

    private static bool HasDesktopRuntime(string architecture)
    {
        var view = architecture == "x86" ? RegistryView.Registry32 : RegistryView.Registry64;
        using var root = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, view);
        using var key = root.OpenSubKey(@"SOFTWARE\dotnet\Setup\InstalledVersions\" + architecture + @"\sharedfx\Microsoft.WindowsDesktop.App");
        return key?.GetValue("Version") is string version && Version.TryParse(version.Split('-')[0], out var parsed) && parsed.Major >= 8;
    }

    private void RegisterComAddin(RegistryView view, string comHost)
    {
        if (!File.Exists(comHost)) throw new InvalidOperationException("插件文件缺失：" + comHost);
        using var baseKey = RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, view);
        using var inproc = baseKey.CreateSubKey(@"Software\Classes\CLSID\" + Clsid + @"\InprocServer32", true)!;
        inproc.SetValue(null, comHost);
        inproc.SetValue("ThreadingModel", "Both");
        using var prog = baseKey.CreateSubKey(@"Software\Classes\" + ProgId, true)!;
        prog.SetValue(null, "PPTist HTML animation add-in");
        using var progClsid = prog.CreateSubKey("CLSID", true)!;
        progClsid.SetValue(null, Clsid);
    }

    private static void RegisterPowerPoint(RegistryView view)
    {
        using var baseKey = RegistryKey.OpenBaseKey(RegistryHive.CurrentUser, view);
        using var key = baseKey.CreateSubKey(@"Software\Microsoft\Office\PowerPoint\Addins\" + ProgId, true)!;
        key.SetValue("FriendlyName", "PPTist HTML 动效");
        key.SetValue("Description", "在当前演示页插入和编辑 HTML 动效");
        key.SetValue("LoadBehavior", 3, RegistryValueKind.DWord);
    }

    private void EnableStartup()
    {
        using var key = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true)!;
        key.SetValue("PPTistOverlay", '"' + Path.Combine(_root, "runtime", "PPTist.Overlay.exe") + '"');
    }

    private void StartOverlay()
    {
        var exe = Path.Combine(_root, "runtime", "PPTist.Overlay.exe");
        if (File.Exists(exe)) Process.Start(new ProcessStartInfo(exe) { UseShellExecute = true, WindowStyle = ProcessWindowStyle.Hidden });
    }
}
