import type {PageMetaData} from "./list.ts";
import {createWS} from "./socket.ts";

export interface PinProps extends PageMetaData {
  userId: string;
  projectId: string;
}

const MakeTogglePinRequest = ({pin, commitId, pageId, userId, projectId}: PinProps) =>
  `422${JSON.stringify([
    "socket.io-request",
    {
      method: "commit",
      data: {
        kind: "page",
        parentId: commitId,
        changes:[{
          pin: pin > 0 ? 0 : Number.MAX_SAFE_INTEGER - Math.floor(Date.now() / 1000),
        }],
        cursor: null,
        pageId,
        userId,
        projectId,
        freeze:true,
      },
    },
  ])}`;

export async function togglePin(data: PinProps) {
  const {send, receive, close} = await createWS(
    "wss://scrapbox.io/socket.io/?EIO=4&transport=websocket"
  );

  const stream = receive();
  await stream.next();
  // 最初の通信に返答する
  await send("40");
  await stream.next();
  // Pinを付け外しするよう命令する
  await send(MakeTogglePinRequest(data));
  await stream.next();

  // 全部の応答が返ってきたら閉じる
  await close();
}