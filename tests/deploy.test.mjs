import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const script = resolve('scripts/deploy.sh');
for (const failed of ['', 'build', 'scp', 'remote', 'password']) {
  test(`deployment ${failed === 'password' ? 'uses default host and password file' : failed ? `stops on ${failed} failure` : 'builds, exports, uploads and deploys'}`, () => {
    const dir = mkdtempSync(join(tmpdir(), 'deploy-test-'));
    try {
      writeFileSync(join(dir, 'sshpass'), '#!/bin/bash\necho "sshpass $1 $2" >> "$CALL_LOG"\n[[ "$1" == -f ]] || exit 8\nshift 2\nexec "$@"\n', { mode: 0o755 });
      writeFileSync(join(dir, 'password'), 'test-secret');
      for (const cmd of ['docker', 'scp', 'ssh']) {
        writeFileSync(join(dir, cmd), `#!/bin/bash\necho "${cmd} $*" >> "$CALL_LOG"\n` +
          (cmd === 'docker' ? 'if [[ "$1" == buildx && "$FAIL" == build ]]; then exit 9; fi\nif [[ "$1" == image ]]; then echo image-data; fi\n' :
           cmd === 'scp' ? '[[ "$FAIL" != scp ]]\n' : 'if [[ "$*" == *mktemp* ]]; then echo /tmp/lumo-deploy.test; else cat >> "$CALL_LOG"; [[ "$FAIL" != remote ]]; fi\n'), { mode: 0o755 });
      }
      const log = join(dir, 'calls');
      const result = spawnSync('bash', failed === 'password' ? [script] : [script, 'user@example.test'], { encoding: 'utf8', env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, CALL_LOG: log, FAIL: failed, DEPLOY_HOST: '', DEPLOY_SSH_PASSWORD_FILE: failed === 'password' ? join(dir, 'password') : '', DEPLOY_OUTPUT_DIR: dir } });
      assert.equal(result.status === 0, (!failed || failed === 'password'), result.stderr);
      const calls = readFileSync(log, 'utf8');
      if (failed === 'build') assert.doesNotMatch(calls, /scp /);
      if (failed === 'scp') assert.doesNotMatch(calls, /compose up/);
      if (!failed || failed === 'password') {
        if (failed === 'password') {
          assert.match(calls, /ubuntu@106\.54\.5\.158/);
          assert.equal((calls.match(/sshpass -f/g) || []).length, 4);
          assert.doesNotMatch(calls + result.stdout + result.stderr, /test-secret/);
        }
        assert.match(calls, /--platform linux\/amd64/);
        assert.match(calls, /docker\.io\/samanhappy\/lumo:latest/);
        assert.match(calls, /scp /);
        assert.match(calls, /--no-build --pull never --force-recreate --wait --wait-timeout 180 app/);
        assert.match(calls, /gzip -t/);
        assert.match(result.stdout, /部署成功/);
      } else assert.doesNotMatch(result.stdout, /部署成功/);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}
