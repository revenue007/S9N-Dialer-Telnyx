# Frontend Migration: Twilio Voice SDK → Telnyx WebRTC SDK

The backend is fully ported. The remaining step is swapping the browser Voice SDK in `index.html`.

## 1. CDN swap

```html
<!-- Remove -->
<script src="https://sdk.twilio.com/js/client/v1.14/twilio.js"></script>

<!-- Add -->
<script src="https://cdn.jsdelivr.net/npm/@telnyx/webrtc@latest/lib/bundle.js"></script>
```

## 2. Token fetch

No change — both SDKs call `/token` and receive `{ token: "..." }`.

## 3. Device initialisation

```js
// Twilio
const device = new Twilio.Device(token, { codecPreferences: ['opus', 'pcmu'] });
device.on('ready', () => { /* SDK ready */ });
device.on('error', (err) => { /* handle */ });

// Telnyx
const client = new TelnyxRTC({ login_token: token });
client.on('telnyx.ready', () => { /* SDK ready */ });
client.on('telnyx.error', (err) => { /* handle */ });
client.connect();
```

## 4. Making a call

```js
// Twilio
const conn = device.connect({ To: '+1234567890', PowerDial: '1' });

// Telnyx — custom params go in clientState (base64 JSON) or custom headers
const call = client.newCall({
  destinationNumber: '+1234567890',
  callerNumber: FROM_NUMBER,
  clientState: btoa(JSON.stringify({ PowerDial: '1' })),
});
```

> The `/voice` webhook receives `clientState` as a base64 string in the `ClientState`
> param. Decode it in `voice.js` if you need PowerDial from there, or pass PowerDial
> as a query param in the TeXML App's webhook URL instead.

## 5. Hanging up

```js
// Twilio
conn.disconnect();

// Telnyx
call.hangup();
```

## 6. Call state events

```js
// Twilio
conn.on('disconnect', () => { /* call ended */ });
conn.on('accept',     () => { /* call connected */ });

// Telnyx — all state changes come through telnyx.notification
client.on('telnyx.notification', (notification) => {
  const call = notification.call;
  if (!call) return;
  if (call.state === 'active')                              { /* connected  */ }
  if (call.state === 'hangup' || call.state === 'destroy') { /* ended      */ }
  if (call.state === 'ringing')                            { /* outbound ringing */ }
});
```

## Docs

- [Telnyx WebRTC JS SDK](https://developers.telnyx.com/docs/voice/webrtc/js-sdk)
- [JS SDK Anatomy](https://developers.telnyx.com/docs/voice/webrtc/js-sdk/anatomy)
- [TelnyxRTC class reference](https://developers.telnyx.com/docs/voice/webrtc/js-sdk/classes/telnyxrtc)
- [Make a call to a web browser](https://developers.telnyx.com/docs/voice/webrtc/make-a-call-to-a-web-browser)
