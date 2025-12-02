import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Play,
  Save,
  Mic,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import axios from "axios";
import { ChapterDTO } from "@/components/admin/dialogs/ChapterFormDialog";

interface ApiOkEnvelope<T> {
  success: boolean;
  data: T;
  meta?: any;
}

interface PageScript {
  pageIndex: number;
  imageUrl: string;
  text: string;        // thoại của trang
  audioUrl?: string;   // audio preview (data URL)
  duration?: number;
  isLoading: boolean;  // loading khi tạo audio preview
}

interface ReviewEditorProps {
  comicId: number;
  chapter: ChapterDTO;
}

const API_BASE = "http://localhost:3000/api";
const token = localStorage.getItem("token");

// Giọng đọc dùng chung cho toàn bộ review
const VOICE_OPTIONS: { id: string; label: string }[] = [
  { id: "zephyr", label: "Giọng dẫn truyện êm (Zephyr)" },
  { id: "achernar", label: "Giọng dẫn truyện trầm (Achernar)" },
  { id: "puck", label: "Nam ấm, tự tin (Puck)" },
  { id: "fenrir", label: "Nam trầm, bí ẩn (Fenrir)" },
  { id: "gacrux", label: "Nam trung tính, rõ (Gacrux)" },
  { id: "kore", label: "Nữ trong trẻo (Kore)" },
  { id: "laomedeia", label: "Nữ nhẹ nhàng (Laomedeia)" },
  { id: "pulcherrima", label: "Nữ sáng, rõ (Pulcherrima)" },
  { id: "rasalgethi", label: "Phản diện trầm (Rasalgethi)" },
  { id: "sadaltager", label: "Phản diện lạnh lùng (Sadaltager)" },
  { id: "umbriel", label: "Giọng trung tính (Umbriel)" },
  { id: "despina", label: "Giọng lạ, khác biệt (Despina)" },
];

const DEFAULT_VOICE = "kore";

const ReviewEditor: React.FC<ReviewEditorProps> = ({ comicId, chapter }) => {
  const navigate = useNavigate();

  const [scriptData, setScriptData] = useState<PageScript[]>([]);
  const [voiceId, setVoiceId] = useState<string>(DEFAULT_VOICE); // GIỌNG CHUNG
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState<Record<number, boolean>>(
    {}
  );

  // --- helper update page ---
  const updatePage = (pageIndex: number, patch: Partial<PageScript>) => {
    setScriptData((prev) =>
      prev.map((p) =>
        p.pageIndex === pageIndex ? { ...p, ...patch } : p
      )
    );
  };

  // --- 1. Khởi tạo dữ liệu (load draft hoặc tạo mới từ images) ---
  useEffect(() => {
    const initEditor = async () => {
      try {
        type DraftPage = {
          pageIndex: number;
          imageUrl: string;
          text?: string;
        };

        type DraftScriptV1 = DraftPage[]; // kiểu cũ: chỉ là array
        type DraftScriptV2 = {
          voiceId?: string;
          pages: DraftPage[];
        };

        type DraftData = { scriptData: DraftScriptV1 | DraftScriptV2 | null };

        const res = await axios.get<ApiOkEnvelope<DraftData>>(
          `${API_BASE}/reviews/draft/${chapter.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const saved = res.data.data.scriptData;

        let pages: DraftPage[] = [];
        let savedVoiceId: string | undefined;

        if (saved && Array.isArray(saved)) {
          // Kiểu cũ: scriptData là mảng
          pages = saved;
        } else if (saved && (saved as DraftScriptV2).pages) {
          // Kiểu mới: { voiceId, pages }
          const v2 = saved as DraftScriptV2;
          pages = v2.pages || [];
          savedVoiceId = v2.voiceId;
        }

        if (pages.length > 0) {
          const normalized: PageScript[] = pages.map((page) => ({
            pageIndex: page.pageIndex,
            imageUrl: page.imageUrl,
            text: page.text || "",
            audioUrl: undefined,
            duration: undefined,
            isLoading: false,
          }));

          setScriptData(normalized);
          setVoiceId(savedVoiceId || DEFAULT_VOICE);
        } else {
          // Không có draft -> tạo mới từ images của chapter
          const initPages: PageScript[] = chapter.images.map((img) => ({
            pageIndex: img.pageNumber,
            imageUrl: img.url,
            text: "",
            audioUrl: undefined,
            duration: undefined,
            isLoading: false,
          }));
          setScriptData(initPages);
          setVoiceId(DEFAULT_VOICE);
        }
      } catch (error) {
        console.error("Lỗi load bản nháp:", error);
        // Fallback: Tạo mới nếu API lỗi
        const initPages: PageScript[] = chapter.images.map((img) => ({
          pageIndex: img.pageNumber,
          imageUrl: img.url,
          text: "",
          audioUrl: undefined,
          duration: undefined,
          isLoading: false,
        }));
        setScriptData(initPages);
        setVoiceId(DEFAULT_VOICE);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (chapter && chapter.images) {
      initEditor();
    }
  }, [chapter]);

  // --- 2. Gọi API ---

  // Preview TTS cho 1 trang: /reviews/tts-preview
  const handleGenAudio = async (pageIndex: number) => {
    const page = scriptData.find((p) => p.pageIndex === pageIndex);
    if (!page) return;
    if (!page.text.trim()) return;

    updatePage(pageIndex, { isLoading: true });

    try {
      type TTSPreviewData = {
        audioBase64: string;
        mimeType: string;
        duration: number;
      };

      const res = await axios.post<ApiOkEnvelope<TTSPreviewData>>(
        `${API_BASE}/reviews/tts-preview`,
        { text: page.text, voiceId }, // dùng GIỌNG CHUNG
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { audioBase64, mimeType, duration } = res.data.data;

      const audioSrc = audioBase64.startsWith("data:")
        ? audioBase64
        : `data:${mimeType || "audio/mpeg"};base64,${audioBase64}`;

      updatePage(pageIndex, {
        isLoading: false,
        audioUrl: audioSrc,
        duration: duration ?? undefined,
      });
    } catch (error) {
      console.error(error);
      alert("Lỗi tạo audio!");
      updatePage(pageIndex, { isLoading: false });
    }
  };

  // Gợi ý thoại bằng AI cho 1 trang (1 text duy nhất)
  const handleGenerateAIDialogues = async (
    pageIndex: number,
    imageUrl: string
  ) => {
    if (
      !window.confirm(
        `Bạn có muốn AI tự động viết lời thoại cho trang ${pageIndex} không? Nội dung hiện tại sẽ bị thay thế.`
      )
    ) {
      return;
    }

    setIsGeneratingAI((prev) => ({ ...prev, [pageIndex]: true }));

    try {
      type AIResponse = {
        dialogues: { text: string }[];
      };

      const res = await axios.post<ApiOkEnvelope<AIResponse>>(
        `${API_BASE}/reviews/generate-dialogues-ai`,
        { imageUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiDialogues = res.data.data.dialogues || [];

      // Gộp tất cả text AI trả về thành 1 đoạn
      const mergedText = aiDialogues
        .map((d) => d.text?.trim())
        .filter(Boolean)
        .join(" ");

      updatePage(pageIndex, {
        text: mergedText,
        audioUrl: undefined,
        duration: undefined,
      });
    } catch (error) {
      console.error("Lỗi khi gọi AI:", error);
      alert("Không thể tạo lời thoại bằng AI. Vui lòng thử lại.");
    } finally {
      setIsGeneratingAI((prev) => ({ ...prev, [pageIndex]: false }));
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      // LƯU THEO KIỂU MỚI: { voiceId, pages: [...] }
      const cleanScript = {
        voiceId,
        pages: scriptData.map((page) => ({
          pageIndex: page.pageIndex,
          imageUrl: page.imageUrl,
          text: page.text,
        })),
      };

      await axios.post<ApiOkEnvelope<{ message: string }>>(
        `${API_BASE}/reviews/draft`,
        {
          chapterId: chapter.id,
          scriptData: cleanScript,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Đã lưu bản nháp thành công!");
    } catch (e) {
      console.error(e);
      alert("Lỗi khi lưu dữ liệu");
    } finally {
      setIsSaving(false);
    }
  };

  // Xuất bản review: gọi /reviews/publish
  const handlePublish = async () => {
    if (!window.confirm("Xuất bản review audio cho chương này?")) return;

    setIsPublishing(true);
    try {
      type Segment = {
        pageIndex: number;
        lineId: string;
        start: number;
        end: number;
      };

      type PublishData = {
        chapterId: number;
        audioUrl: string | null;
        totalDuration: number;
        timeline: {
          segments: Segment[];
        };
      };

      const res = await axios.post<ApiOkEnvelope<PublishData>>(
        `${API_BASE}/reviews/publish`,
        { chapterId: chapter.id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Publish result:", res.data.data);
      alert("Xuất bản review thành công!");
    } catch (e) {
      console.error(e);
      alert("Lỗi khi xuất bản review");
    } finally {
      setIsPublishing(false);
    }
  };

  // --- 3. Render ---

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin" /> Loading Editor...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Sticky */}
      <header className="sticky top-0 z-10 border-b shadow-sm px-6 py-4 flex justify-between items-center bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold">Review Editor</h1>
            <p className="text-xs text-gray-500">
              Đang sửa: {chapter.title} (Chương {chapter.number})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* GIỌNG ĐỌC CHUNG */}
          <div className="flex flex-col text-xs">
            <span className="uppercase text-[10px] font-semibold text-gray-400 tracking-wider mb-1">
              Giọng đọc review
            </span>
            <select
              className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-gray-50 focus:ring-2 focus:ring-blue-100 outline-none min-w-[220px]"
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
            >
              {VOICE_OPTIONS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSaveDraft}
            disabled={isSaving || isPublishing}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? "Đang lưu..." : "Lưu Nháp"}
          </button>

          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-70"
          >
            {isPublishing ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isPublishing ? "Đang xuất bản..." : "Xuất bản review"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-12">
        {scriptData.map((page) => (
          <div
            key={page.pageIndex}
            className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col lg:flex-row"
          >
            {/* Cột trái: Ảnh */}
            <div className="w-full lg:w-5/12 bg-gray-900 flex justify-center items-start p-4 relative group">
              <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                Trang {page.pageIndex}
              </span>
              <img
                src={page.imageUrl}
                alt={`Page ${page.pageIndex}`}
                className="max-w-full h-auto object-contain rounded shadow-lg"
                loading="lazy"
              />
            </div>

            {/* Cột phải: Kịch bản */}
            <div className="w-full lg:w-7/12 p-6 flex flex-col bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="w-2 h-6 bg-blue-500 rounded-full" />
                  Kịch bản âm thanh trang {page.pageIndex}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleGenerateAIDialogues(page.pageIndex, page.imageUrl)
                    }
                    disabled={isGeneratingAI[page.pageIndex]}
                    className="flex items-center gap-1.5 text-sm bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-md hover:bg-purple-200 transition-colors shadow-sm disabled:opacity-60"
                  >
                    {isGeneratingAI[page.pageIndex] ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    AI Viết thoại
                  </button>
                </div>
              </div>

              {/* Ô thoại duy nhất cho trang */}
              <div className="space-y-3 flex-1">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 block">
                    Lời thoại cho trang {page.pageIndex}
                  </label>
                  <textarea
                    className="w-full text-sm border-gray-300 border rounded-md p-2 focus:ring-2 focus:ring-blue-100 outline-none resize-none min-h-[80px]"
                    placeholder="Nhập nội dung thoại cho trang này..."
                    value={page.text}
                    onChange={(e) =>
                      updatePage(page.pageIndex, {
                        text: e.target.value,
                        audioUrl: undefined, // đổi text thì reset audio preview
                        duration: undefined,
                      })
                    }
                  />

                  {/* Audio player */}
                  {page.audioUrl && (
                    <div className="mt-3 flex items-center gap-2 bg-green-50 px-3 py-2 rounded-md border border-green-100">
                      <Play
                        size={14}
                        className="text-green-600 fill-current"
                      />
                      <audio
                        controls
                        src={page.audioUrl}
                        className="h-6 w-full opacity-90"
                      />
                      <span className="text-xs text-green-700 whitespace-nowrap font-mono">
                        {page.duration ? `${page.duration.toFixed(1)}s` : ""}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-3 flex justify-between items-center border-t pt-3 border-gray-100">
                    <button
                      onClick={() => handleGenAudio(page.pageIndex)}
                      disabled={page.isLoading || !page.text.trim()}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded transition-all
                        ${
                          page.audioUrl
                            ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        }
                        disabled:opacity-50`}
                    >
                      {page.isLoading ? (
                        <Loader2 className="animate-spin h-3 w-3" />
                      ) : (
                        <Mic size={14} />
                      )}
                      {page.audioUrl ? "Tạo lại Audio" : "Tạo Audio"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default ReviewEditor;
