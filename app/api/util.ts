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
  return copyStream(req.body, (message) => {
    sql`INSERT INTO logs (ip, message) VALUES (${getIP(
      req,
    )}, ${message.toString("utf-8")})`;
  });
}

export function getIP(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || req.ip
  );
}
