import { injectable, singleton } from "tsyringe";

@singleton()
export class Logger {
  info(message:string, e?: Error) {
    console.log(message, e);
  }

  error(message:string, e?: Error) {
    console.error(message, e);
  }
}

export const logger = new Logger();
