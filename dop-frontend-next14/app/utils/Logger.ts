import { injectable } from "tsyringe";

@injectable()
export class Logger {
  info(message:string, e?: Error) {
    console.log(message, e);
  }

  error(message:string, e?: Error) {
    console.error(message, e);
  }
}
