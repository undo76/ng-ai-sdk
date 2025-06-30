import { signal } from "@angular/core";
import {
  type ChatState,
  type ChatStatus,
  type UIMessage,
  type ChatInit,
  AbstractChat,
} from "ai";

export class Chat<
  UI_MESSAGE extends UIMessage = UIMessage,
> extends AbstractChat<UI_MESSAGE> {
  constructor(init: ChatInit<UI_MESSAGE>) {
    super({
      ...init,
      state: new AngularChatState(init.messages),
    });
  }
}

class AngularChatState<UI_MESSAGE extends UIMessage = UIMessage>
  implements ChatState<UI_MESSAGE>
{
  private _messages = signal<UI_MESSAGE[]>([]);
  private _status = signal<ChatStatus>("ready");
  private _error = signal<Error | undefined>(undefined);

  get messages(): UI_MESSAGE[] {
    return this._messages();
  }

  set messages(messages: UI_MESSAGE[]) {
    this._messages.set([...messages]);
  }

  get status(): ChatStatus {
    return this._status();
  }

  set status(status: ChatStatus) {
    this._status.set(status);
  }

  get error(): Error | undefined {
    return this._error();
  }

  set error(error: Error | undefined) {
    this._error.set(error);
  }

  constructor(initialMessages: UI_MESSAGE[] = []) {
    this._messages.set([...initialMessages]);
  }

  setMessages = (messages: UI_MESSAGE[]) => {
    this._messages.set([...messages]);
  };

  pushMessage = (message: UI_MESSAGE) => {
    this._messages.update((msgs) => [...msgs, message]);
  };

  popMessage = () => {
    this._messages.update((msgs) => msgs.slice(0, -1));
  };

  replaceMessage = (index: number, message: UI_MESSAGE) => {
    this._messages.update((msgs) => {
      const copy = [...msgs];
      copy[index] = message;
      return copy;
    });
  };

  snapshot = <T>(thing: T): T => structuredClone(thing);
}
