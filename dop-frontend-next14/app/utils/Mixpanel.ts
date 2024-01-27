export class Mixpanel {
  track(
    event_name: string,
    properties?: object,
  ): void {
    console.log(`[mixpanel] event_name=${event_name}, properties=${JSON.stringify(properties)}`);
  }
}

export const mixpanel = new Mixpanel();
