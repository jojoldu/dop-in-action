import { Callback, Dict, RequestOptions } from "mixpanel-browser";

export class Mixpanel {
  track(
    event_name: string,
    properties?: Dict,
    optionsOrCallback?: RequestOptions | Callback,
    callback?: Callback,
  ): void {
    console.log(`[mixpanel] event_name=${event_name}, properties=${JSON.stringify(properties)}`);
  }
}

export const mixpanel = new Mixpanel();
