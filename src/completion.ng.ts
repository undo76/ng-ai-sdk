import { signal, WritableSignal } from "@angular/core";
import {
  callCompletionApi,
  generateId,
  type CompletionRequestOptions,
  type UseCompletionOptions,
} from "ai";

export type CompletionOptions = Readonly<UseCompletionOptions>;

export class Completion {
  readonly #options: CompletionOptions;

  readonly #id = signal<string>(generateId());
  readonly #api = signal<string>("/api/completion");
  readonly #streamProtocol = signal<"data" | "text">("data");

  readonly #input: WritableSignal<string> = signal("");
  readonly #completion = signal<string>("");
  readonly #error = signal<Error | undefined>(undefined);
  readonly #loading = signal<boolean>(false);

  #abortController: AbortController | null = null;

  constructor(options: CompletionOptions = {}) {
    this.#options = options;
    this.#completion.set(options.initialCompletion ?? "");
    this.#input.set(options.initialInput ?? "");
    this.#api.set(options.api ?? "/api/completion");
    this.#id.set(options.id ?? generateId());
    this.#streamProtocol.set(options.streamProtocol ?? "data");
  }

  /** Current value of the completion. Writable. */
  get completion(): string {
    return this.#completion();
  }

  set completion(value: string) {
    this.#completion.set(value);
  }

  /** Current value of the input. Writable. */
  get input(): string {
    return this.#input();
  }

  set input(value: string) {
    this.#input.set(value);
  }

  /** The error object of the API request */
  get error(): Error | undefined {
    return this.#error();
  }

  /** Flag that indicates whether an API request is in progress. */
  get loading(): boolean {
    return this.#loading();
  }

  /** Abort the current request immediately, keep the generated tokens if any. */
  stop = () => {
    try {
      this.#abortController?.abort();
    } catch {
      // ignore
    } finally {
      this.#loading.set(false);
      this.#abortController = null;
    }
  };

  /** Send a new prompt to the API endpoint and update the completion state. */
  complete = async (prompt: string, options?: CompletionRequestOptions) =>
    this.#triggerRequest(prompt, options);

  /** Form submission handler to automatically reset input and call the completion API */
  handleSubmit = async (event?: { preventDefault?: () => void }) => {
    event?.preventDefault?.();
    if (this.#input()) {
      await this.complete(this.#input());
    }
  };

  #triggerRequest = async (
    prompt: string,
    options?: CompletionRequestOptions,
  ) => {
    return callCompletionApi({
      api: this.#api(),
      prompt,
      credentials: this.#options.credentials,
      headers: { ...this.#options.headers, ...options?.headers },
      body: {
        ...this.#options.body,
        ...options?.body,
      },
      streamProtocol: this.#streamProtocol(),
      fetch: this.#options.fetch,
      setCompletion: (completion: string) => {
        this.#completion.set(completion);
      },
      setLoading: (loading: boolean) => {
        this.#loading.set(loading);
      },
      setError: (error: any) => {
        this.#error.set(error);
      },
      setAbortController: (abortController) => {
        this.#abortController = abortController ?? null;
      },
      onFinish: this.#options.onFinish,
      onError: this.#options.onError,
    });
  };
}
