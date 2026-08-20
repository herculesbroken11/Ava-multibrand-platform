import { env } from "./config/env";
import { buildApp } from "./app";
import { frontendOriginAllowList } from "./modules/brands/origins";

async function start() {
  const app = await buildApp();

  try {
    await app.listen({ host: env.HOST, port: env.PORT });
    app.log.info(
      {
        port: env.PORT,
        host: env.HOST,
        frontendOrigins: frontendOriginAllowList(),
        trustForwardedHost: env.TRUST_FORWARDED_HOST,
      },
      "API listening",
    );
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
