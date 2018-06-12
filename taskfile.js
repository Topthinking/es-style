const notifier = require('node-notifier')

export async function dev (task, opts) {
  await task.source(opts.src || 'src/**/*.js').babel().target('dist/')
  notify('Compiled src files')
}

export async function build(task, opts) { 
  await task.source(opts.src || 'src/**/*.js').babel().target('dist/')
  notify('Compiled src files')
}

export default async function (task) {
  await task.start('dev')
  await task.watch('src/**/*.js', 'dev')
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
