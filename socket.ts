export type Return = {
  close: () => Promise<Event | undefined>;
  send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
  receive: () => AsyncGenerator<MessageEvent>;
};
export function createWS(url: string, protcols?: string | string[]) {
  return new Promise<Return>((resolve, reject) => {
    const socket = new WebSocket(url, protcols);

    const once = (
      type: keyof WebSocketEventMap,
      callback: (event?: Event | MessageEvent | CloseEvent) => void,
    ) => {
      const wrapper = (e: Event | MessageEvent | CloseEvent) => {
        callback(e);
        socket.removeEventListener(type, wrapper);
      };
      socket.addEventListener(type, wrapper);
    };

    once("error", reject);
    once("open", () =>
      resolve({
        close: () =>
          new Promise((res) => {
            socket.close();
            once("close", (e) => res(e));
          }),
        send: (data) => {
          socket.send(data);
        },
        receive: async function* () {
          while (true) {
            const response = await new Promise((res) =>
              once("message", (e) => res(e))
            );
            yield response as MessageEvent;
          }
        },
      }));
  });
}