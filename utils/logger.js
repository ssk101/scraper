export default class Logger {
  constructor(prefix) {
    this.methods = [
      'error',
      'warn',
      'debug',
      'info',
      'log',
      'table',
    ]

    for(const method of this.methods) {
      this[method] = function() {
        let args = Array.prototype.slice.call(arguments)
        if(this.prefix) {
          args.unshift(this.prefix)
        }
        return console[method].apply(console, args)
      }
    }
  }
}