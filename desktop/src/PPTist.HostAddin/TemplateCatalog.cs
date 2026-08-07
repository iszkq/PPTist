using PPTist.Overlay.Models;

namespace PPTist.HostAddin;

internal static class TemplateCatalog
{
    public static WidgetDefinition Create(string name)
    {
        var widget = new WidgetDefinition { Width = 320, Height = 220 };
        switch (name)
        {
            case "幸运转盘":
                widget.Html = "<div class=\"wheel-wrap\"><div id=\"wheel\" class=\"wheel\"></div><button id=\"go\">开始抽取</button><div id=\"result\"></div></div>";
                widget.Css = ".wheel-wrap{text-align:center;font-family:Arial;color:#fff}.wheel{width:190px;height:190px;margin:auto;border-radius:50%;border:8px solid #fff;box-shadow:0 4px 18px #0008;background:conic-gradient(#ff6b6b 0 25%,#ffd166 0 50%,#06d6a0 0 75%,#4dabf7 0);transition:transform 4s cubic-bezier(.15,.8,.2,1)}#go{margin:12px;padding:7px 16px;border:0;border-radius:16px;background:#fff;color:#d9485f;font-weight:bold;cursor:pointer}#result{font-size:16px;font-weight:bold;text-shadow:0 1px 4px #000}";
                widget.JavaScript = "const list=['奖品 A','奖品 B','奖品 C','奖品 D'];let angle=0;document.querySelector('#go').onclick=()=>{const hit=Math.floor(Math.random()*list.length);angle+=1800+(list.length-hit)*90;const wheel=document.querySelector('#wheel');wheel.style.transform=`rotate(${angle}deg)`;setTimeout(()=>document.querySelector('#result').textContent=`抽中：${list[hit]}`,4050)};";
                break;
            case "萤火虫":
                widget.Html = "<div id=\"fireflies\"></div>";
                widget.Css = "#fireflies{position:relative;width:100%;height:100%;overflow:hidden}.fire{position:absolute;width:7px;height:7px;border-radius:50%;background:#fff7a3;box-shadow:0 0 10px 4px #f7f08a;animation:fly var(--d) ease-in-out infinite alternate}@keyframes fly{to{transform:translate(var(--x),var(--y));opacity:.2}}";
                widget.JavaScript = "const root=document.querySelector('#fireflies');for(let i=0;i<30;i++){const e=document.createElement('i');e.className='fire';e.style.left=Math.random()*100+'%';e.style.top=Math.random()*100+'%';e.style.setProperty('--x',(Math.random()*180-90)+'px');e.style.setProperty('--y',(Math.random()*130-65)+'px');e.style.setProperty('--d',(1.4+Math.random()*3)+'s');root.append(e)}";
                break;
            case "雨滴":
                widget.Html = "<div id=\"rain\"></div>";
                widget.Css = "#rain{width:100%;height:100%;overflow:hidden;position:relative}.drop{position:absolute;top:-35px;width:2px;height:28px;border-radius:50%;background:linear-gradient(transparent,#d9f3ff);filter:drop-shadow(0 0 3px #8ed8ff);animation:fall var(--d) linear infinite}@keyframes fall{to{transform:translate(var(--x),calc(100vh + 50px))}}";
                widget.JavaScript = "const root=document.querySelector('#rain');for(let i=0;i<55;i++){const e=document.createElement('i');e.className='drop';e.style.left=Math.random()*100+'%';e.style.setProperty('--x',(Math.random()*80-40)+'px');e.style.setProperty('--d',(.8+Math.random()*1.2)+'s');e.style.animationDelay=(-Math.random()*2)+'s';root.append(e)}";
                break;
            default:
                widget.Html = "<div class=\"hello\">在此输入 HTML</div>";
                widget.Css = ".hello{width:100%;height:100%;display:grid;place-items:center;color:#fff;font:24px Microsoft YaHei;background:#1677ff99;border-radius:12px}";
                widget.JavaScript = string.Empty;
                break;
        }
        return widget;
    }
}
