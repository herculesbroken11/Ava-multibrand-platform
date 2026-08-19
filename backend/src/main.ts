import { env } from "./config/env";
import { buildApp } from "./app";

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ host: env.HOST, port: env.PORT });
    app.log.info(
      {
        port: env.PORT,
        host: env.HOST,
        frontendOrigin: env.FRONTEND_ORIGIN,
      },
      "API listening",
    );
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
