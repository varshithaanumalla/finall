// Seed script: downloads 10 DISTINCT sample clips (one per category) into
// /app/uploads and creates a video document for each.
// Run inside the backend container:  docker compose exec backend node seed.js
import mongoose from "mongoose";
import { promises as fs } from "fs";
import { createWriteStream } from "fs";
import path from "path";
import https from "https";
import video from "./Modals/video.js";
import user from "./Modals/Auth.js";

const DBURL = process.env.DB_URL || "mongodb://mongodb:27017/yourtube";
const UPLOAD_DIR = path.resolve("uploads");

// One distinct, reachable clip per category.
const SAMPLES = [
  { title: "Lofi Beats to Relax",            channel: "Music Hub",     category: "Music",      file: "cat-music.mp4",      url: "https://download.samplelib.com/mp4/sample-5s.mp4" },
  { title: "Epic Gaming Montage 2026",       channel: "ProGamerX",     category: "Gaming",     file: "cat-gaming.mp4",     url: "https://test-videos.co.uk/vids/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4" },
  { title: "Top 10 Movie Moments",           channel: "CineWorld",     category: "Movies",     file: "cat-movies.mp4",     url: "https://media.w3.org/2010/05/sintel/trailer.mp4" },
  { title: "Breaking Tech News Today",       channel: "TechDaily",     category: "News",       file: "cat-news.mp4",       url: "https://media.w3.org/2010/05/video/movie_300.mp4" },
  { title: "Football Highlights Weekly",     channel: "SportsZone",    category: "Sports",     file: "cat-sports.mp4",     url: "https://download.samplelib.com/mp4/sample-10s.mp4" },
  { title: "Building a React App in 10 Min", channel: "CodeWithMe",    category: "Technology", file: "cat-tech.mp4",       url: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4" },
  { title: "Stand-up Comedy Special",        channel: "LaughFactory",  category: "Comedy",     file: "cat-comedy.mp4",     url: "https://media.w3.org/2010/05/bunny/trailer.mp4" },
  { title: "Learn Calculus the Easy Way",    channel: "EduMaster",     category: "Education",  file: "cat-education.mp4",  url: "https://filesamples.com/samples/video/mp4/sample_640x360.mp4" },
  { title: "How Black Holes Work",           channel: "ScienceNow",    category: "Science",    file: "cat-science.mp4",    url: "https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4" },
  { title: "Street Food Tour: Mumbai",       channel: "FoodieTrails",  category: "Food",       file: "cat-food.mp4",       url: "https://filesamples.com/samples/video/mp4/sample_960x400_ocean_with_audio.mp4" },
];

function download(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error("Too many redirects"));
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return resolve(download(res.headers.location, dest, redirects + 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        const out = createWriteStream(dest);
        res.pipe(out);
        out.on("finish", () => out.close(() => resolve()));
        out.on("error", reject);
      })
      .on("error", reject);
  });
}

async function main() {
  await mongoose.connect(DBURL);
  console.log("Connected to", DBURL);
  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  let u = await user.findOne({ email: "seed@yourtube.com" });
  if (!u) {
    u = await user.create({ email: "seed@yourtube.com", name: "Seed User", channelname: "Seed Channel", image: "" });
    console.log("Created user:", u._id.toString());
  } else {
    console.log("User exists:", u._id.toString());
  }

  // Clean out previously-seeded docs so we end with exactly these 10.
  const titles = SAMPLES.map((s) => s.title);
  const del = await video.deleteMany({ videotitle: { $in: titles } });
  if (del.deletedCount) console.log("Removed previous seeded docs:", del.deletedCount);

  for (const s of SAMPLES) {
    const dest = path.join(UPLOAD_DIR, s.file);
    try {
      await download(s.url, dest);
      const stat = await fs.stat(dest);
      const v = await video.create({
        videotitle: s.title,
        filename: s.file,
        filetype: "video/mp4",
        filepath: `uploads/${s.file}`,
        filesize: String(stat.size),
        videochanel: s.channel,
        uploader: u._id.toString(),
        views: Math.floor(Math.random() * 100000),
        Like: Math.floor(Math.random() * 3000),
      });
      console.log(`[${s.category}] ${s.title} -> ${s.file} (${stat.size} bytes) id=${v._id.toString()}`);
    } catch (e) {
      console.error(`FAILED [${s.category}] ${s.title}: ${e.message}`);
    }
  }

  const all = await video.find();
  console.log(`\nSeed complete. Total videos now: ${all.length}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
