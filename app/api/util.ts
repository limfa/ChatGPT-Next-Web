import { NextRequest } from "next/server";
import { sql } from "@vercel/postgres";

export function copyStream(
  readableStream: ReadableStream<Uint8Array> | null,
  end: (a: Buffer) => void,
) {
  if (readableStream == null) return readableStream;

  const result: Uint8Array[] = [];
  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    start() {},
    transform(chunk, controller) {
      controller.enqueue(chunk);
      result.push(chunk);
    },
    flush() {
      end(Buffer.concat(result));
    },
  });

  return readableStream.pipeThrough(transformStream);
}

export function streamBodyLog(req: NextRequest) {
  return copyStream(req.body, (m) => {
    const message = m.toString("utf-8");
    const user_agent = req.headers.get("user-agent");
    const auth = req.headers.get("Authorization") ?? "";
    const ip = getIP(req);
    sql`INSERT INTO logs (ip, message, user_agent, auths) VALUES (${ip}, ${message}, ${user_agent}, ${auth})`;
  });
}

export function getIP(req: NextRequest) {
  return (
    req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for") || req.ip
  );
}
