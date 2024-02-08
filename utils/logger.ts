import { consola as log } from 'consola'



function info(message: string) {
  log.box((` ${this.name} `) + ' ' + (message))
}

function success(message: string) {
  log.success((message))
}

function warn(message: string) {
  log.warn((message))
}

function error(message: string) {
  log.error(new Error(message))
}

export default class Logger {
  name: string

  constructor(name: string) {
    this.name = name
  }

  public info = info
  public success = success
  public warn = warn
  public error = error
}