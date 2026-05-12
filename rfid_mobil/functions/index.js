const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const { google } = require("googleapis");
const Busboy = require("busboy");
const os = require("os");
const fs = require("fs");
const path = require("path");

setGlobalOptions({ maxInstances: 10 });

const FOLDER_ID = "15pe157KOt2QVabVgTSnNACxdiLoLN-r3";

exports.uploadToDrive = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).send("");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Only POST allowed");
  }

  const busboy = Busboy({ headers: req.headers });

  let uploadPath = "";
  let fileName = "";

  busboy.on("file", (fieldname, file, info) => {
    fileName = `urun_${Date.now()}_${info.filename}`;
    uploadPath = path.join(os.tmpdir(), fileName);
    file.pipe(fs.createWriteStream(uploadPath));
  });

  busboy.on("finish", async () => {
    try {
      if (!uploadPath || !fileName) {
        return res.status(400).json({ error: "Dosya bulunamadı" });
      }

      const auth = new google.auth.GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/drive"],
      });

      const drive = google.drive({
        version: "v3",
        auth,
      });

      const uploaded = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [FOLDER_ID],
        },
        media: {
          mimeType: "image/jpeg",
          body: fs.createReadStream(uploadPath),
        },
        fields: "id",
      });

      await drive.permissions.create({
        fileId: uploaded.data.id,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      const imageUrl = `https://drive.google.com/uc?export=view&id=${uploaded.data.id}`;

      fs.unlinkSync(uploadPath);

      return res.status(200).json({ imageUrl });
    } catch (e) {
      return res.status(500).json({ error: e.toString() });
    }
  });

  req.pipe(busboy);
});