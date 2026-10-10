import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const script = resolve('scripts/deploy.sh');
for (const failed of ['', 'pull', 'build', 'remote', 'password']) {
  test(`deployment ${failed === 'password' ? 'uses default host and password file' : failed ? `stops on ${failed} failure` : 'pulls code, builds remotely and deploys'}`, () => {
    const dir = mkdtempSync(join(tmpdir(), 'deploy-test-'));
    try {
      writeFileSync(join(dir, 'sshpass'), '#!/bin/bash\necho "sshpass $1 $2" >> "$CALL_LOG"\n[[ "$1" == -f ]] || exit 8\nshift 2\nexec "$@"\n', { mode: 0o755 });
      writeFileSync(join(dir, 'password'), 'test-secret');
      const remoteDir = join(dir, 'remote');
      mkdirSync(remoteDir);
      writeFileSync(join(remoteDir, 'compose.yaml'), 'services: {}');
      writeFileSync(join(remoteDir, '.env'), 'server-secret');
      for (const cmd of ['docker', 'git', 'ssh']) {
        writeFileSync(join(dir, cmd), `#!/bin/bash\necho "${cmd} $*" >> "$CALL_LOG"\n` +
          (cmd === 'docker' ? '[[ "$FAIL" != build || "$1" != build ]]\n' :
           cmd === 'git' ? '[[ "$FAIL" != pull ]]\n' :
           '[[ "$FAIL" != remote ]] || exit 9; bash -c "${@: -1}";\n'), { mode: 0o755 });
      }
      const log = join(dir, 'calls');
      const result = spawnSync('bash', failed === 'password' ? [script] : [script, 'user@example.test'], { encoding: 'utf8', env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, CALL_LOG: log, FAIL: failed, DEPLOY_HOST: '', DEPLOY_SSH_PASSWORD_FILE: failed === 'password' ? join(dir, 'password') : '', DEPLOY_DIR: remoteDir, DEPLOY_SUDO: 'no' } });
      assert.equal(result.status === 0, (!failed || failed === 'password'), result.stderr);
      const calls = readFileSync(log, 'utf8');
      if (failed === 'build') assert.doesNotMatch(calls, /compose up/);
      if (failed === 'pull') assert.doesNotMatch(calls, /docker /);
      if (!failed || failed === 'password') {
        if (failed === 'password') {
          assert.match(calls, /root@43\.130\.3\.115/);
          assert.equal((calls.match(/sshpass -f/g) || []).length, 1);
          assert.doesNotMatch(calls + result.stdout + result.stderr, /test-secret/);
        }
        assert.match(calls, /--platform linux\/amd64/);
        assert.match(calls, /docker\.io\/samanhappy\/lumo:latest/);
        assert.match(calls, /git pull --ff-only/);
        assert.ok(calls.indexOf("git pull") < calls.indexOf("docker build"));
        assert.match(calls, /--no-build --pull never --force-recreate --wait --wait-timeout 180 app/);
        assert.match(calls, /docker build --platform/);

        assert.doesNotMatch(calls, /scp |tar\.gz|docker (buildx|image save|load)/m);
        assert.equal(readFileSync(join(remoteDir, '.env'), 'utf8'), 'server-secret');
        assert.match(result.stdout, /部署成功/);
      } else assert.doesNotMatch(result.stdout, /部署成功/);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
}
