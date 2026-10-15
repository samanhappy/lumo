import { GRADES } from '../grades.js';
import { escape, notify, icon } from '../../ui.js';
const roles = { student:'学生', parent:'家长', admin:'管理员' };
export async function renderUsers(root, request, actor) {
  root.innerHTML = '<section class="page users-page"><h1>用户管理</h1><p role="status">正在读取账号…</p></section>';
  try {
    const users = await request('/api/users');
    if (!root.isConnected) return;
    const studentName = id => users.find(u => u.role === 'student' && u.studentId === id)?.name || id;
    root.innerHTML = `<section class="page users-page"><header class="users-heading"><div><h1>用户管理</h1><p>共 ${users.length} 个账号 · 管理家庭成员与登录权限</p></div><button class="primary" id="add-user">${icon('plus')} 添加用户</button></header><div class="panel users-list"><div class="user-row users-columns" aria-hidden="true"><span>用户</span><span>角色</span><span>关联学生</span><span>状态</span><span></span></div>${users.map(u => `<div class="user-row"><div class="user-identity"><span class="user-avatar" aria-hidden="true">${escape(u.name.slice(0,1))}</span><div><strong>${escape(u.name)}${u.username === actor.username ? '<small class="user-self">你</small>' : ''}</strong><p>${escape(u.username)}${u.role === 'student' ? ` · ${escape(u.grade || '未设置年级')}` : ''}</p></div></div><span class="user-role">${roles[u.role]}</span><span class="user-student">${u.role === 'parent' ? escape(studentName(u.studentId)) : '—'}</span><span class="user-status ${u.disabled ? 'disabled' : ''}">${u.disabled ? '已停用' : '正常'}</span><button class="quiet user-edit" data-user="${escape(u.username)}" aria-label="编辑${escape(u.name)}">${icon('edit')}<span>编辑</span></button></div>`).join('')}</div><p class="users-note">先添加学生，再为家长选择关联学生。停用账号会保留学习记录。</p></section>`;
    root.querySelector('#add-user').onclick = () => userDialog(root, request, actor, users);
    root.querySelectorAll('[data-user]').forEach(button => button.onclick = () => userDialog(root, request, actor, users, users.find(u => u.username === button.dataset.user)));
  } catch(error) { root.querySelector('[role=status]').textContent = error.message; }
}
function userDialog(root, request, actor, users, account) {
  const dialog = document.createElement('dialog'); dialog.className = 'task-dialog user-dialog'; dialog.setAttribute('aria-labelledby','user-dialog-title');
  const editing = !!account, self = account?.username === actor.username;
  dialog.innerHTML = `<form class="user-form"><header class="user-dialog-heading"><div><h2 id="user-dialog-title">${editing ? '编辑用户' : '添加用户'}</h2><p>${editing ? '更新账号信息与登录权限' : '为新的家庭成员创建登录账号'}</p></div><button type="button" class="quiet" id="close-user" aria-label="关闭">${icon('close')}</button></header><div class="user-form-grid"><label class="field">姓名<input name="name" required maxlength="40" placeholder="例如：小雨" value="${escape(account?.name || '')}" autofocus></label><label class="field">用户名<input name="username" required maxlength="40" pattern="[a-zA-Z0-9_-]+" autocomplete="off" placeholder="用于登录，如 xiaoyu" value="${escape(account?.username || '')}" ${editing ? 'readonly' : ''}></label></div><label class="field">账号角色<select name="role" ${self ? 'disabled' : ''}>${Object.entries(roles).map(([value,label]) => `<option value="${value}" ${value === (account?.role || 'student') ? 'selected' : ''}>${label}</option>`).join('')}</select></label><div id="user-association"></div><label class="field">${editing ? '重置密码' : '登录密码'}<input name="password" type="password" ${editing ? '' : 'required'} minlength="8" maxlength="128" autocomplete="new-password" placeholder="${editing ? '留空则保留原密码' : '至少 8 位'}"></label>${editing ? `<label class="user-disabled"><input type="checkbox" name="disabled" ${account.disabled ? 'checked' : ''} ${self ? 'disabled' : ''}><span>停用账号<small>${self ? '当前管理员账号不能停用' : '禁止登录，保留已有学习记录'}</small></span></label><p class="user-session-note">保存后，该用户需要重新登录。</p>` : ''}<p class="error" role="alert" id="user-error"></p><footer class="user-dialog-actions"><button class="secondary" type="button" id="cancel-user">取消</button><button class="primary" type="submit">${editing ? '保存修改' : '创建用户'}</button></footer></form>`;
  const form = dialog.querySelector('form'); let busy = false;
  const association = dialog.querySelector('#user-association');
  function roleChanged() {
    const role = form.elements.role.value;
    if (role === 'parent') {
      const students = users.filter(u => u.role === 'student' && (!u.disabled || u.studentId === account?.studentId));
      association.innerHTML = `<label class="field">关联学生<select name="studentId" required><option value="">请选择学生</option>${students.map(u => `<option value="${escape(u.studentId)}" ${u.studentId === account?.studentId ? 'selected' : ''}>${escape(u.name)}（${escape(u.username)}）${u.disabled ? ' · 已停用' : ''}</option>`).join('')}</select>${students.length ? '' : '<small>请先创建一个学生账号。</small>'}</label>`;
    } else if (role === 'student' && editing) {
      association.innerHTML = `<label class="field">学生 ID<input name="studentId" required maxlength="80" pattern="[a-zA-Z0-9_-]+" value="${escape(account.studentId || account.username)}"><small>用于归属学习记录，修改后将切换到对应学生的数据。</small></label>`;
    } else association.innerHTML = '';
    if (role === 'student') association.innerHTML += `<label class="field">年级<select name="grade"><option value="">未设置</option>${GRADES.map(grade => `<option value="${grade}" ${grade === account?.grade ? 'selected' : ''}>${grade}</option>`).join('')}</select></label>`;
  }
  form.elements.role.onchange = roleChanged; roleChanged();
  const close = () => { if (busy) return; dialog.close(); dialog.remove(); };
  dialog.oncancel = event => { event.preventDefault(); close(); };
  dialog.querySelector('#close-user').onclick = close; dialog.querySelector('#cancel-user').onclick = close;
  form.onsubmit = async event => {
    event.preventDefault();
    const input = { ...Object.fromEntries(new FormData(form)), role:form.elements.role.value, disabled:!!form.elements.disabled?.checked, create:!editing };
    if (input.role === 'student' && !editing) input.studentId = input.username;
    busy = true; const submit = form.querySelector('[type=submit]'); submit.textContent = '保存中…';
    const controls = [...form.querySelectorAll('button,input,select')]; const states = controls.map(control => control.disabled); controls.forEach(control => control.disabled = true);
    try {
      await request('/api/users', input);
      busy = false; close();
      if (input.username === actor.username) { location.replace('/login'); return; }
      notify(editing ? '修改已保存。' : '用户已创建。'); await renderUsers(root, request, actor);
    } catch(error) { dialog.querySelector('#user-error').textContent = error.message; }
    finally { busy = false; controls.forEach((control,i) => control.disabled = states[i]); submit.textContent = editing ? '保存修改' : '创建用户'; }
  };
  root.append(dialog); dialog.showModal();
}
