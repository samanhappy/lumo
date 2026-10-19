import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

test('direct navigation and refresh serve app pages while private files remain forbidden',async t=>{
  const dir=await mkdtemp(join(tmpdir(),'lumo-routes-'));
  const port=30000+Math.floor(Math.random()*20000);
  const server=spawn(process.execPath,['server.js'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port),LUMO_DB_PATH:join(dir,'test.sqlite'),LUMO_USERS:'',DATABASE_URL:'',PGHOST:''},stdio:['ignore','pipe','pipe']});
  t.after(async()=>{
    if(server.exitCode===null) {const exited=once(server,'exit');server.kill('SIGTERM');await exited;}
    await rm(dir,{recursive:true,force:true});
  });
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(new Error('server startup timeout')),10000);
    server.once('error',error=>{clearTimeout(timer);reject(error);});
    server.once('exit',code=>{clearTimeout(timer);reject(new Error(`server exited: ${code}`));});
    server.stdout.on('data',data=>{if(data.toString().includes('Lumo:')) {clearTimeout(timer);resolve();}});
  });
  for(const path of ['/apps','/apps','/apps/english-vocabulary','/apps/english-vocabulary/study','/today','/today/pomodoro','/apps/pomodoro','/login']) {
    const response=await fetch(`http://127.0.0.1:${port}${path}`);
    assert.equal(response.status,200,path);
    assert.match(response.headers.get('content-type'),/text\/html/);
    assert.match(await response.text(),/<div id="app"/);
  }
  assert.equal((await fetch(`http://127.0.0.1:${port}/api/courses`)).status,401);
  const login=await fetch(`http://127.0.0.1:${port}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'student',password:'student123'})});
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const books=await fetch(`http://127.0.0.1:${port}/api/courses`,{headers:{cookie}});
  assert.equal(books.status,200);assert.equal((await books.json()).length,3);
  for(const path of ['/seeds/textbooks/courses.js','/server.js','/.env','/private.sqlite']) {
    assert.equal((await fetch(`http://127.0.0.1:${port}${path}`)).status,403,path);
  }
});
