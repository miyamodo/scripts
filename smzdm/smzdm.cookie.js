const cookieName = '什么值得买'
const cookieKey = 'chavy_cookie_smzdm'

// 兼容不同环境的 header 大小写
const cookieVal = ($request.headers['Cookie'] || $request.headers['cookie'] || '').trim()

// 读取旧值，用于判断是否变化（避免重复通知）
const oldCookie = ($persistentStore.read(cookieKey) || '').trim()

function notify(title, sub, body) {
  try { $notification.post(title, sub, body) } catch (e) {}
}

function done() {
  try { $done({}) } catch (e) {}
}

// 基础校验：没抓到就直接提示（可注释掉，避免频繁提示）
if (!cookieVal) {
  notify(cookieName, '未获取到 Cookie', '请确认已开启 MITM 且命中带 Cookie 的请求')
  console.log(`[${cookieName}] 未获取到 Cookie：请求未携带 Cookie 头或未命中重写`)
  return done()
}

// 过滤明显无效的 Cookie（可按需增删）
const looksValid =
  cookieVal.length > 20 &&
  !/deleted|expires=Thu, 01 Jan 1970/i.test(cookieVal)

// 如果你脚本后续依赖 sess，可强制要求包含 sess=
// （如果你只用网页签到也许不必强制，按需开关）
const requireSess = false
const hasSess = /(?:^|;\s*)sess=/.test(cookieVal)

if (!looksValid || (requireSess && !hasSess)) {
  notify(cookieName, 'Cookie 可能无效', requireSess ? '未检测到 sess= 字段' : '请确认已登录后再抓取')
  console.log(`[${cookieName}] Cookie 可能无效：length=${cookieVal.length}, hasSess=${hasSess}`)
  console.log(cookieVal)
  return done()
}

// Cookie 未变化则不写入、不通知（减少打扰）
if (oldCookie && oldCookie === cookieVal) {
  console.log(`[${cookieName}] Cookie 未变化，跳过写入`)
  return done()
}

// 写入
const ok = $persistentStore.write(cookieVal, cookieKey)
if (ok) {
  // 只展示摘要，避免在通知/日志里泄露完整 Cookie
  const preview = cookieVal.slice(0, 60) + (cookieVal.length > 60 ? '...' : '')
  notify(cookieName, 'Cookie 写入成功', oldCookie ? '已更新（Cookie 发生变化）' : '已保存')
  console.log(`[${cookieName}] 写入成功 -> ${cookieKey}`)
  console.log(`[${cookieName}] hasSess=${hasSess} cookiePreview=${preview}`)
} else {
  notify(cookieName, 'Cookie 写入失败', '请检查脚本权限/持久化存储是否可用')
  console.log(`[${cookieName}] 写入失败 -> ${cookieKey}`)
}

done()
