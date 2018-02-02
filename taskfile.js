const notifier = require('node-notifier')

export async function compile (task) {
  await task.parallel(['src'])
}

export async function src (task, opts) {
  await task.source(opts.src || 'src/**/*.js').babel().target('dist/')
  notify('Compiled src files')
}

export async function build (task) {
  await task.serial(['compile'])
}

export default async function (task) {
  await task.start('build')
  await task.watch('src/**/*.js', 'src')
}

export async function release (task) {
  await task.clear('dist').start('build')
}

function notify (msg) {
  return notifier.notify({
    title: '🔥 es-style',
    message: msg,
    icon: false
  })
}
