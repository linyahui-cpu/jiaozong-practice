import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import os from 'node:os';

const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.QUIZ_PORT||8765);
const lan=process.argv.includes('--lan');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.wasm':'application/wasm','.pdf':'application/pdf','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.zip':'application/zip'};
const server=http.createServer((request,response)=>{
 try{
  if(!['GET','HEAD'].includes(request.method)){response.writeHead(405);return response.end();}
  let relative=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  if(relative.endsWith('/'))relative+='index.html';
  const file=path.resolve(root,'.'+relative);
  if(!file.startsWith(root+path.sep)||relative.includes('\0')){response.writeHead(403);return response.end();}
  fs.stat(file,(error,stat)=>{
   if(error||!stat.isFile()){response.writeHead(404);return response.end('Not found');}
   response.writeHead(200,{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
   if(request.method==='HEAD')return response.end();
   fs.createReadStream(file).on('error',()=>response.destroy()).pipe(response);
  });
 }catch{response.writeHead(400);response.end('Bad request');}
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`端口 ${port} 已使用。若练习室已经启动，请访问 http://127.0.0.1:${port}；否则关闭占用程序后重试。`:error.message);process.exitCode=1;});
server.listen(port,lan?'0.0.0.0':'127.0.0.1',()=>{
 console.log(`教综练习室已启动：http://127.0.0.1:${port}`);
 if(lan)for(const network of Object.values(os.networkInterfaces()))for(const address of network??[])if(address.family==='IPv4'&&!address.internal)console.log(`同一 Wi-Fi 的手机可打开：http://${address.address}:${port}`);
 console.log('请保持此窗口运行。按 Ctrl+C 停止。');
});
