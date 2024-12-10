import { env } from "./env";
import { app } from "./app";

app.listen(env.PORT).then(() => {
  console.log(`Server listening `);
});
