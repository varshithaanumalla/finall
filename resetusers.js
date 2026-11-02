// DESTRUCTIVE: wipes all users and their related data (subscriptions,
// downloads, comments, watch parties). Use for a clean testing slate.
// Does NOT delete videos.
//
// Run:  docker compose exec backend node resetusers.js
import mongoose from "mongoose";
import user from "./Modals/Auth.js";
import subscription from "./Modals/subscription.js";
import download from "./Modals/download.js";
import comment from "./Modals/comment.js";
import watchparty from "./Modals/watchparty.js";

async function main() {
  await mongoose.connect(process.env.DB_URL);
  console.log("Connected to", process.env.DB_URL);

  const u = await user.deleteMany({});
  const s = await subscription.deleteMany({});
  const d = await download.deleteMany({});
  const c = await comment.deleteMany({});
  const w = await watchparty.deleteMany({});

  console.log("Deleted:");
  console.log("  users:        ", u.deletedCount);
  console.log("  subscriptions:", s.deletedCount);
  console.log("  downloads:    ", d.deletedCount);
  console.log("  comments:     ", c.deletedCount);
  console.log("  watchparties: ", w.deletedCount);
  console.log("Videos were left intact.");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
