// app/services/review.service.js
const { GoogleGenAI } = require("@google/genai");
const cloudinary = require("../config/cloudinary");
const AppError = require("../utils/AppError");

const GEMINI_VISION_MODEL = "gemini-2.5-flash"
const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";
const DEFAULT_VOICE = "kore";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Parse sampleRate từ mimeType dạng "audio/L16;codec=pcm;rate=24000"
 */
function parseSampleRate(mimeType = "audio/L16;codec=pcm;rate=24000") {
  const parts = mimeType.split(";").map((p) => p.trim());
  const ratePart = parts.find((p) => p.startsWith("rate="));
  if (!ratePart) return 24000;
  const rate = Number(ratePart.split("=")[1]);
  return Number.isFinite(rate) ? rate : 24000;
}

/**
 * Tính duration (giây) từ PCM L16 buffer + sampleRate
 */
function calculateDurationFromPCM(pcmBuffer, sampleRate = 24000) {
  const bytesPerSample = 2; // 16-bit
  const samples = pcmBuffer.length / bytesPerSample;
  return samples / sampleRate;
}

/**
 * Convert "audio/L16;codec=pcm;rate=24000" (raw PCM) -> WAV Buffer.
 */
function l16ToWavBuffer(pcmBuffer, mimeType = "audio/L16;codec=pcm;rate=24000", numChannels = 1) {
  const [type, codec, rateStr] = mimeType
    .split(";")
    .map((e) => (e.includes("=") ? e.trim().split("=")[1] : e.trim()));

  if (type !== "audio/L16" || codec !== "pcm") {
    throw new Error(`Unsupported mimeType: ${mimeType}. Expected audio/L16;codec=pcm;rate=###`);
  }

  const sampleRate = Number(rateStr);
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmBuffer.length;
  const fileSize = 36 + dataSize;

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const setString = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF header
  setString(0, "RIFF");
  view.setUint32(4, fileSize, true);
  setString(8, "WAVE");

  // fmt chunk
  setString(12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // AudioFormat = 1 (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  setString(36, "data");
  view.setUint32(40, dataSize, true);

  const headerBuffer = Buffer.from(new Uint8Array(header));
  return Buffer.concat([headerBuffer, pcmBuffer]);
}

/**
 * Gọi Gemini TTS chung, trả về { pcmBuffer, mimeType }
 */
async function callGeminiTTS({ text, voiceId }) {
  const voiceName = typeof voiceId === "string" && voiceId.trim()
    ? voiceId.trim()
    : DEFAULT_VOICE;

  const response = await ai.models.generateContent({
    model: GEMINI_TTS_MODEL,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  const base64Data = part?.inlineData?.data;
  const mimeType = part?.inlineData?.mimeType || "audio/L16;codec=pcm;rate=24000";

  if (!base64Data) {
    throw new AppError("Gemini TTS không trả về audio", 500, "TTS_NO_AUDIO");
  }

  const pcmBuffer = Buffer.from(base64Data, "base64");
  return { pcmBuffer, mimeType, base64Data };
}

/**
 * Tạo audio chính thức: PCM -> WAV -> upload Cloudinary
 */
async function generateOfficialAudio({ text, voiceId, chapterId }) {
  const { pcmBuffer, mimeType } = await callGeminiTTS({ text, voiceId });
  const sampleRate = parseSampleRate(mimeType);
  const duration = calculateDurationFromPCM(pcmBuffer, sampleRate);

  const wavBuffer = l16ToWavBuffer(pcmBuffer, mimeType, 1);

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video", // audio = video trong Cloudinary
        folder: "comic_reviews/reviews",
        public_id: `chapter_${chapterId}_${Date.now()}`,
        format: "wav",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(wavBuffer);
  });

  return {
    audioUrl: uploadResult.secure_url,
    duration: uploadResult.duration || duration,
  };
}

module.exports = ({ sequelize, model }) => {
  const ReviewDraft = model.ReviewDraft;
  const ReviewPublished = model.ReviewPublished;

  return {
    async generateDialoguesFromImage({ imageUrl }) {
    if (!imageUrl) {
      throw new AppError("Thiếu imageUrl", 400, "VALIDATION_ERROR");
    }

    const prompt = `
      Bạn là một trợ lý biên kịch truyện tranh chuyên nghiệp.
      Nhiệm vụ của bạn là phân tích hình ảnh một trang truyện và viết lời thoại/nội dung tường thuật phù hợp cho CẢ TRANG (ngắn gọn, dễ hiểu, tự nhiên).

      Phân tích kỹ hình ảnh được cung cấp và thực hiện:
      - Mô tả ngắn gọn bối cảnh, cảm xúc nhân vật, hành động chính.
      - Viết lời thoại hoặc lời dẫn truyện phù hợp cho trang đó.
      - Có thể chia thành 1–3 câu, nhưng cuối cùng sẽ được gộp lại thành một đoạn văn.

      **YÊU CẦU ĐẦU RA (RẤT QUAN TRỌNG):**
      Chỉ trả về một JSON hợp lệ, không có giải thích hay ghi chú gì thêm.

      JSON phải ở MỘT trong hai dạng sau:

      1) Dạng mảng object:
      [
        { "text": "Câu/đoạn thoại thứ nhất..." },
        { "text": "Câu/đoạn thoại thứ hai..." }
      ]

      HOẶC

      2) Dạng object đơn:
      {
        "text": "Toàn bộ nội dung thoại cho trang này..."
      }

      Không được trả về Markdown, không được bao bọc bởi \`\`\`.
    `;

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new AppError("Không thể tải ảnh từ URL", 500, "IMAGE_FETCH_ERROR");
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    };

    const result = await ai.models.generateContent({
      model: GEMINI_VISION_MODEL,
      contents: [{ parts: [{ text: prompt }, imagePart] }],
    });

    const parts = result.candidates?.[0]?.content?.parts;

    if (!parts || !Array.isArray(parts)) {
      console.error("Gemini không trả về parts:", JSON.stringify(result, null, 2));
      throw new AppError("Gemini không trả về nội dung văn bản", 500, "AI_NO_PARTS");
    }

    const rawText = parts
      .map((p) => p.text)
      .filter(Boolean)
      .join("\n")
      .trim();

    if (!rawText) {
      console.error("Gemini parts không có text:", JSON.stringify(parts, null, 2));
      throw new AppError("Gemini không trả về text hợp lệ", 500, "AI_EMPTY_TEXT");
    }

    const jsonText = rawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      const parsed = JSON.parse(jsonText);
      let dialoguesArray;

      if (Array.isArray(parsed)) {
        dialoguesArray = parsed;
      } else if (parsed && typeof parsed === "object" && typeof parsed.text === "string") {
        dialoguesArray = [parsed];
      } else {
        throw new Error("AI response is neither array nor object with text");
      }

      const dialogues = dialoguesArray
        .map((item) => {
          if (typeof item === "string") {
            return { text: item };
          }
          if (item && typeof item === "object" && typeof item.text === "string") {
            return { text: item.text };
          }
          return null;
        })
        .filter((x) => x && x.text.trim());

      if (!dialogues.length) {
        throw new Error("No valid dialogues with text found");
      }

      return { dialogues };
    } catch (e) {
      console.error("Lỗi parse JSON từ Gemini:", e);
      console.error("Raw text từ Gemini:", jsonText);
      throw new AppError("AI trả về định dạng JSON không hợp lệ", 500, "AI_JSON_ERROR");
    }
  },

    async saveDraft({ userId, chapterId, scriptData }) {
      if (!chapterId || !scriptData) {
        throw new AppError("Thiếu dữ liệu chapterId / scriptData", 400, "VALIDATION_ERROR");
      }

      const where = userId ? { chapterId, userId } : { chapterId };

      const existing = await ReviewDraft.findOne({ where });

      if (existing) {
        // Ghi đè scriptData
        await existing.update({ scriptData });
      } else {
        // Tạo mới 1 dòng
        await ReviewDraft.create({
          ...where,
          scriptData,
        });
      }

      return { message: "Lưu bản nháp thành công" };
    },

    async getDraft({ userId, chapterId }) {
      if (!chapterId) {
        throw new AppError("Thiếu chapterId", 400, "VALIDATION_ERROR");
      }

      const where = userId ? { chapterId, userId } : { chapterId };
      const draft = await ReviewDraft.findOne({ where });

      return {
        scriptData: draft ? draft.scriptData : null,
      };
    },

    async ttsPreview({ text, voiceId }) {
      if (!text || !text.trim()) {
        throw new AppError(
          "Nội dung text không được để trống",
          400,
          "VALIDATION_ERROR"
        );
      }

      // 1. Gọi Gemini TTS (trả về PCM L16)
      const { pcmBuffer, mimeType } = await callGeminiTTS({
        text,
        voiceId,
      });

      // 2. Tính duration từ PCM như cũ
      const sampleRate = parseSampleRate(mimeType);
      const duration = calculateDurationFromPCM(pcmBuffer, sampleRate);

      // 3. Convert PCM -> WAV (dùng hàm bạn đã viết)
      const wavBuffer = l16ToWavBuffer(pcmBuffer, mimeType, 1);

      // 4. Encode WAV thành base64 để gửi cho FE
      const base64Wav = wavBuffer.toString("base64");
      const clientMimeType = "audio/wav";

      return {
        audioBase64: base64Wav,
        mimeType: clientMimeType, 
        duration,
      };
    },

        /**
     * Xuất bản review cho 1 chapter:
     * - Đọc scriptData từ ReviewDraft
     * - Gọi TTS từng câu, GOM PCM lại thành 1 buffer
     * - Convert PCM -> WAV 1 lần, upload Cloudinary
     * - Tính timeline (start/end per line)
     * - Lưu vào ReviewPublished (audioUrl KHÔNG null nữa)
     */
    async publishReview({ userId, chapterId }) {
    if (!chapterId) {
      throw new AppError("Thiếu chapterId", 400, "VALIDATION_ERROR");
    }

    const where = userId ? { chapterId, userId } : { chapterId };
    const draft = await ReviewDraft.findOne({ where });

    if (!draft || !draft.scriptData) {
      throw new AppError("Chưa có bản nháp để xuất bản", 400, "NO_DRAFT");
    }

    const rawScript = draft.scriptData;
    // 1. Chuẩn hoá scriptData thành mảng các câu thoại phẳng (flatLines)

    let voiceId = DEFAULT_VOICE;
    let flatLines = [];

    if (!rawScript || Array.isArray(rawScript)) {
      throw new AppError(
        "scriptData phải có dạng { voiceId, pages: [...] }",
        500,
        "SCRIPT_FORMAT_ERROR"
      );
    }

    voiceId = rawScript.voiceId || DEFAULT_VOICE;

    const pages = rawScript.pages;
    if (!Array.isArray(pages)) {
      throw new AppError("pages phải là một mảng", 400, "SCRIPT_FORMAT_ERROR");
    }

    for (const page of pages) {
      const pageIndex = page.pageIndex;
      const text = (page.text || "").trim();
      if (!text) continue;

      flatLines.push({
        pageIndex,
        lineId: `page_${pageIndex}`,
        text,
      });
    }

    if (!flatLines.length) {
      throw new AppError(
        "Không có câu thoại nào để xuất bản",
        400,
        "NO_LINES"
      );
    }


    // 2. Ghép text thành một chuỗi duy nhất
    const combinedText = flatLines
      .map((l) => l.text.trim())
      .filter(Boolean)
      .join("\n");

    // 3. Gọi Gemini TTS đúng 1 lần với GIỌNG ĐỌC ĐÃ CHỌN
    const { pcmBuffer, mimeType } = await callGeminiTTS({
      text: combinedText,
      voiceId, // <-- DÙNG GIỌNG TỪ DRAFT, KHÔNG HARD-CODE DEFAULT_NỮA
    });

    const sampleRate = parseSampleRate(mimeType);
    const totalDuration = calculateDurationFromPCM(pcmBuffer, sampleRate);

    // 4. Chia duration theo tỉ lệ độ dài text của từng đoạn
    const totalChars = flatLines.reduce(
      (sum, l) => sum + l.text.length,
      0
    );

    let currentTime = 0;
    const segments = [];

    for (const line of flatLines) {
      const ratio = line.text.length / totalChars;
      const duration = totalDuration * ratio;

      const start = currentTime;
      const end = start + duration;

      segments.push({
        pageIndex: line.pageIndex,
        lineId: line.lineId,
        start,
        end,
      });

      currentTime = end;
    }

    // 5. PCM -> WAV 1 lần
    const wavBuffer = l16ToWavBuffer(pcmBuffer, mimeType, 1);

    // 6. Upload WAV lên Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video", // audio = video trong Cloudinary
          folder: "comic_reviews/reviews",
          public_id: `chapter_${draft.chapterId}_${Date.now()}`,
          format: "wav",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(wavBuffer);
    });

    const audioUrl = uploadResult.secure_url;
    const finalTotalDuration = uploadResult.duration || totalDuration;

    const timeline = { segments };

    // 7. Tạo hoặc cập nhật ReviewPublished theo chapterId
    const wherePub = { chapterId: draft.chapterId };

    const existingPub = await ReviewPublished.findOne({ where: wherePub });

    if (existingPub) {
      await existingPub.update({
        audioUrl,
        totalDuration: finalTotalDuration,
        timeline,
      });
    } else {
      await ReviewPublished.create({
        chapterId: draft.chapterId,
        audioUrl,
        totalDuration: finalTotalDuration,
        timeline,
      });
    }

    return {
      chapterId: draft.chapterId,
      audioUrl,
      totalDuration: finalTotalDuration,
      timeline,
    };

    },
    async getPublished({ chapterId }) {
      if (!chapterId) {
        throw new AppError("Thiếu chapterId", 400, "VALIDATION_ERROR");
      }

      const published = await ReviewPublished.findOne({ where: { chapterId } });
      if (!published) {
        throw new AppError("Chưa có review được xuất bản cho chapter này", 404, "NOT_FOUND");
      }

      return {
        chapterId: published.chapterId,
        audioUrl: published.audioUrl,
        totalDuration: published.totalDuration,
        timeline: published.timeline,
      };
    },
  };
};
