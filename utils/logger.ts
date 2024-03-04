import signale from 'signale'



function complete(message: string) {
  signale.complete((`[${this.name}] `) + (message))
}


function warn(message: string) {
  signale.warn((`[${this.name}] `) + (message))
}

function error(message: string) {
  signale.error((`[${this.name}] `) + new Error(message))
}

function log(message: string) {
  signale.log((`[${this.name}] `) + (message))
}

function start(message: string){
  signale.start((`[${this.name}] `) + message)
}

function pending(message: string){
  signale.pending((`[${this.name}] `) + message)
}

function success(message: string) {
  signale.success((`[${this.name}] `) + (message))
}

function awaiter(message: string){
  signale.await((`[${this.name}] `) + message)
}

function note(message: string){
  signale.note((`[${this.name}] `) + message)
}


export default class Logger {
  name: string

  constructor(name: string) {
    this.name = name
  }

  public complete = complete
  public success = success
  public warn = warn
  public error = error
  public log = log
  public start = start
  public pending = pending
  public await = awaiter
  public note = note

}