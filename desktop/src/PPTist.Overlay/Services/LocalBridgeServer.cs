using PPTist.Overlay.Models;
using System.IO;
using System.Net;
using System.Text;
using System.Text.Json;

namespace PPTist.Overlay.Services;

public sealed class LocalBridgeServer : IDisposable
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly HttpListener _listener = new();
    private readonly WidgetStore _widgetStore;
    private readonly string _staticRoot = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "PPTistPlugin", "office-addin");
    private readonly CancellationTokenSource _cancellation = new();
    public event EventHandler? WidgetsChanged;

    public LocalBridgeServer(WidgetStore widgetStore)
    {
        _widgetStore = widgetStore;
        _listener.Prefixes.Add("http://127.0.0.1:32147/");
        _listener.Prefixes.Add("http://localhost:32147/");
    }

    public void Start()
    {
        _listener.Start();
        _ = Task.Run(ListenAsync);
    }

    private async Task ListenAsync()
    {
        while (!_cancellation.IsCancellationRequested)
        {
            try
            {
                var context = await _listener.GetContextAsync();
                _ = Task.Run(() => HandleAsync(context));
            }
            catch when (_cancellation.IsCancellationRequested) { }
            catch { }
        }
    }

    private async Task HandleAsync(HttpListenerContext context)
    {
        context.Response.Headers["Access-Control-Allow-Origin"] = "*";
        context.Response.Headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS";
        context.Response.Headers["Access-Control-Allow-Headers"] = "Content-Type";
        if (context.Request.HttpMethod == "OPTIONS") { context.Response.StatusCode = 204; context.Response.Close(); return; }
        if (context.Request.HttpMethod == "GET" && context.Request.Url?.AbsolutePath.StartsWith("/office-addin/", StringComparison.OrdinalIgnoreCase) == true)
        {
            await ServeStaticAsync(context);
            return;
        }
        if (context.Request.Url?.AbsolutePath == "/health") { await WriteAsync(context.Response, 200, "{\"status\":\"ok\"}"); return; }
        if (context.Request.Url?.AbsolutePath == "/widgets" && context.Request.HttpMethod == "GET")
        {
            var presentationKey = context.Request.QueryString["presentationKey"];
            if (string.IsNullOrWhiteSpace(presentationKey))
            {
                await WriteAsync(context.Response, 400, "{\"error\":\"presentationKey is required\"}");
                return;
            }
            await WriteAsync(context.Response, 200, JsonSerializer.Serialize(_widgetStore.GetForPresentation(presentationKey), JsonOptions));
            return;
        }
        if (context.Request.Url?.AbsolutePath == "/widgets" && context.Request.HttpMethod == "POST")
        {
            try
            {
                using var reader = new StreamReader(context.Request.InputStream, Encoding.UTF8);
                var request = JsonSerializer.Deserialize<WidgetUpdateRequest>(await reader.ReadToEndAsync(), JsonOptions);
                if (request is null || string.IsNullOrWhiteSpace(request.PresentationKey)) throw new InvalidOperationException();
                _widgetStore.ReplaceForPresentation(request.PresentationKey, request.Widgets ?? []);
                WidgetsChanged?.Invoke(this, EventArgs.Empty);
                await WriteAsync(context.Response, 200, "{\"status\":\"saved\"}");
            }
            catch { await WriteAsync(context.Response, 400, "{\"error\":\"invalid widget payload\"}"); }
            return;
        }
        await WriteAsync(context.Response, 404, "{\"error\":\"not found\"}");
    }

    private async Task ServeStaticAsync(HttpListenerContext context)
    {
        var relative = context.Request.Url?.AbsolutePath["/office-addin/".Length..] ?? string.Empty;
        if (relative.Length == 0) relative = "taskpane.html";
        relative = relative.Replace('/', Path.DirectorySeparatorChar);
        if (relative.Contains("..", StringComparison.Ordinal) || relative.Contains(new string(Path.DirectorySeparatorChar, 2), StringComparison.Ordinal))
        {
            await WriteAsync(context.Response, 400, "{\"error\":\"invalid path\"}");
            return;
        }
        var file = Path.Combine(_staticRoot, relative);
        if (!File.Exists(file)) { await WriteAsync(context.Response, 404, "{\"error\":\"file not found\"}"); return; }
        var extension = Path.GetExtension(file).ToLowerInvariant();
        context.Response.ContentType = extension switch
        {
            ".html" => "text/html; charset=utf-8",
            ".css" => "text/css; charset=utf-8",
            ".js" => "text/javascript; charset=utf-8",
            ".xml" => "application/xml; charset=utf-8",
            _ => "application/octet-stream"
        };
        var bytes = await File.ReadAllBytesAsync(file);
        context.Response.StatusCode = 200;
        await context.Response.OutputStream.WriteAsync(bytes);
        context.Response.Close();
    }

    private static async Task WriteAsync(HttpListenerResponse response, int statusCode, string payload)
    {
        response.StatusCode = statusCode;
        response.ContentType = "application/json; charset=utf-8";
        await response.OutputStream.WriteAsync(Encoding.UTF8.GetBytes(payload));
        response.Close();
    }

    public void Dispose()
    {
        _cancellation.Cancel();
        if (_listener.IsListening) _listener.Stop();
        _listener.Close();
    }

    private sealed class WidgetUpdateRequest
    {
        public string PresentationKey { get; set; } = string.Empty;
        public List<WidgetDefinition>? Widgets { get; set; }
    }
}
