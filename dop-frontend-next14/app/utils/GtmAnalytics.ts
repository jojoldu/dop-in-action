import { singleton } from "tsyringe";

@singleton()
export class GtmAnalytics {
  track(
    event_name: string,
    properties?: object,
  ): void {
    console.log(`[GTM Analytics] event_name=${event_name}, properties=${JSON.stringify(properties)}`);
  }
}

export const gtmAnalytics = new GtmAnalytics();
