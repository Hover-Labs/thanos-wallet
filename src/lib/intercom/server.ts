import { Runtime, browser } from "webextension-polyfill-ts";
import {
  MessageType,
  RequestMessage,
  ResponseMessage,
  ErrorMessage,
  SubscriptionMessage
} from "./types";

const DEFAULT_ERROR_MESSAGE = "Unexpected error occured";

type Listener = (msg: any, port: Runtime.Port) => void;

export class IntercomServer {
  private ports = new Set<Runtime.Port>();
  private listeners = new Set<Listener>();

  constructor() {
    /* handling of new incoming and closed connections */
    browser.runtime.onConnect.addListener(port => {
      this.addPort(port);

      port.onDisconnect.addListener(() => {
        this.removePort(port);
      });
    });
  }

  /**
   * Callback should return a promise
   */
  handleRequest(handler: (payload: any) => Promise<any>) {
    const handleReqMessage = (msg: any, port: Runtime.Port) => {
      if (msg?.type === MessageType.Req) {
        (async msg => {
          try {
            const data = await handler(msg.data);
            this.respond(port, {
              type: MessageType.Res,
              reqId: msg.reqId,
              data
            });
          } catch (err) {
            this.respond(port, {
              type: MessageType.Err,
              reqId: msg.reqId,
              data: "message" in err ? err.message : DEFAULT_ERROR_MESSAGE
            });
          }
        })(msg as RequestMessage);
      }
    };

    this.addListener(handleReqMessage);
    return () => {
      this.removeListener(handleReqMessage);
    };
  }

  broadcast(data: any) {
    const msg: SubscriptionMessage = { type: MessageType.Sub, data };
    this.ports.forEach(port => {
      port.postMessage(msg);
    });
  }

  private respond(port: Runtime.Port, msg: ResponseMessage | ErrorMessage) {
    port.postMessage(msg);
  }

  private addPort(port: Runtime.Port) {
    this.listeners.forEach(listener => {
      port.onMessage.addListener(listener);
    });
    this.ports.add(port);
  }

  private removePort(port: Runtime.Port) {
    this.listeners.forEach(listener => {
      port.onMessage.removeListener(listener);
    });
    this.ports.delete(port);
  }

  private addListener(listener: Listener) {
    this.ports.forEach(port => {
      port.onMessage.addListener(listener);
    });
    this.listeners.add(listener);
  }

  private removeListener(listener: Listener) {
    this.ports.forEach(port => {
      port.onMessage.removeListener(listener);
    });
    this.listeners.delete(listener);
  }
}