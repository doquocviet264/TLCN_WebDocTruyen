import React, { useState, useEffect } from "react";
import { Play, Save, Mic, Loader2, Sparkles, X } from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { ChapterDTO } from "@/components/admin/dialogs/ChapterFormDialog";
import ConfirmationDialog from "@/components/dialogs/ConfirmationDialog";

interface ApiOkEnvelope<T> {
  success: boolean;
  data: T;
  meta?: any;
}

interface PageScript {
  pageIndex: number;
  imageUrl: string;
  text: string;
  audioUrl?: string;
  duration?: number;
  isLoading: boolean;
}

interface ReviewEditorProps {
  comicId: number;
  chapter: ChapterDTO;
  onClose: () => void;
}

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

const ReviewEditor: React.FC<ReviewEditorProps> = ({
  comicId,
  chapter,
  onClose,
}) => {
  const [scriptData, setScriptData] = useState<PageScript[]>([]);
  const [voiceId, setVoiceId] = useState<string>(DEFAULT_VOICE);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState<Record<number, boolean>>(
    {}
  );
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const token = localStorage.getItem("token");

  const updatePage = (pageIndex: number, patch: Partial<PageScript>) => {
    setScriptData((prev) =>
      prev.map((p) => (p.pageIndex === pageIndex ? { ...p, ...patch } : p))
    );
  };

  useEffect(() => {
    const initEditor = async () => {
      try {
        type DraftPage = {
          pageIndex: number;
          imageUrl: string;
          text?: string;
        };

        type DraftScriptV1 = DraftPage[];
        type DraftScriptV2 = {
          voiceId?: string;
          pages: DraftPage[];
        };

        type DraftData = { scriptData: DraftScriptV1 | DraftScriptV2 | null };

        const res = await axios.get<ApiOkEnvelope<DraftData>>(
          `${import.meta.env.VITE_API_URL}/reviews/draft/${chapter.id}`,
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
          pages = saved;
        } else if (saved && (saved as DraftScriptV2).pages) {
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
        console.error("Error loading draft:", error);
        toast.error("Không thể tải bản nháp. Đang khởi tạo trình soạn thảo mới.");
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

  const handleGenAudio = async (pageIndex: number) => {
    const page = scriptData.find((p) => p.pageIndex === pageIndex);
    if (!page || !page.text.trim()) return;

    updatePage(pageIndex, { isLoading: true });

    try {
      type TTSPreviewData = {
        audioBase64: string;
        mimeType: string;
        duration: number;
      };

      const res = await axios.post<ApiOkEnvelope<TTSPreviewData>>(
        `${import.meta.env.VITE_API_URL}/reviews/tts-preview`,
        { text: page.text, voiceId },
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
      toast.success("Tạo audio thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Tạo audio thất bại. Vui lòng thử lại.");
      updatePage(pageIndex, { isLoading: false });
    }
  };

  const handleGenerateAIDialogues = (pageIndex: number, imageUrl: string) => {
    setConfirmation({
      isOpen: true,
      title: "Tạo hội thoại bằng AI",
      description: `Bạn có chắc muốn tạo hội thoại AI cho trang ${pageIndex} không? Nội dung hiện tại sẽ bị ghi đè.`,
      onConfirm: async () => {
        setIsGeneratingAI((prev) => ({ ...prev, [pageIndex]: true }));

        try {
          type AIResponse = {
            dialogues: { text: string }[];
          };

          const res = await axios.post<ApiOkEnvelope<AIResponse>>(
            `${import.meta.env.VITE_API_URL}/reviews/generate-dialogues-ai`,
            { imageUrl },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const aiDialogues = res.data.data.dialogues || [];
          const mergedText = aiDialogues
            .map((d) => d.text?.trim())
            .filter(Boolean)
            .join(" ");

          updatePage(pageIndex, {
            text: mergedText,
            audioUrl: undefined,
            duration: undefined,
          });
          toast.success("Tạo hội thoại AI thành công!");
        } catch (error) {
          console.error("AI generation error:", error);
          toast.error("Tạo hội thoại AI thất bại. Vui lòng thử lại.");
        } finally {
          setIsGeneratingAI((prev) => ({ ...prev, [pageIndex]: false }));
        }
      },
    });
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const cleanScript = {
        voiceId,
        pages: scriptData.map((page) => ({
          pageIndex: page.pageIndex,
          imageUrl: page.imageUrl,
          text: page.text,
        })),
      };

      await axios.post<ApiOkEnvelope<{ message: string }>>(
        `${import.meta.env.VITE_API_URL}/reviews/draft`,
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
      toast.success("Lưu bản nháp thành công!");
    } catch (e) {
      console.error(e);
      toast.error("Lưu bản nháp thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = () => {
    setConfirmation({
      isOpen: true,
      title: "Xuất bản review",
      description: "Bạn có chắc muốn xuất bản review audio cho chương này không?",
      onConfirm: async () => {
        setIsPublishing(true);
        try {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/reviews/publish`,
            { chapterId: chapter.id },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          toast.success("Xuất bản review thành công!");
        } catch (e) {
          console.error(e);
          toast.error("Xuất bản review thất bại. Vui lòng thử lại.");
        } finally {
          setIsPublishing(false);
        }
      },
    });
  };

  if (isLoadingData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-background text-foreground">
      <ToastContainer />
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-sm px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-card-foreground">
            Trình soạn thảo review
          </h1>
          <p className="text-xs text-muted-foreground">
            Đang chỉnh sửa: {chapter.title} (Chương {chapter.number})
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-xs">
            <span className="uppercase text-[10px] font-semibold tracking-wider mb-1 text-muted-foreground">
              Giọng review
            </span>
            <select
              className="text-sm border border-border bg-background rounded-md px-2 py-1 text-foreground outline-none focus:ring-2 focus:ring-ring min-w-[220px]"
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
            className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? "Đang lưu..." : "Lưu bản nháp"}
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-70"
          >
            {isPublishing ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isPublishing ? "Đang xuất bản..." : "Xuất bản"}
          </button>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
            <X size={20} />
          </button>
        </div>
      </header>
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full space-y-12">
          {scriptData.map((page) => (
            <div
              key={page.pageIndex}
              className="rounded-xl shadow-sm border border-border bg-card overflow-hidden flex flex-col lg:flex-row"
            >
              <div className="w-full lg:w-5/12 flex justify-center items-start p-4 relative group">
                <span className="absolute top-2 left-2 text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                  Trang {page.pageIndex}
                </span>
                <img
                  src={page.imageUrl}
                  alt={`Trang ${page.pageIndex}`}
                  className="max-w-full h-auto object-contain rounded shadow-lg"
                  loading="lazy"
                />
              </div>
              <div className="w-full lg:w-7/12 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold flex items-center gap-2 text-card-foreground">
                    <span className="w-2 h-6 rounded-full bg-primary" />
                    Kịch bản audio cho trang {page.pageIndex}
                  </h3>
                  <button
                    onClick={() =>
                      handleGenerateAIDialogues(page.pageIndex, page.imageUrl)
                    }
                    disabled={isGeneratingAI[page.pageIndex]}
                    className="flex items-center gap-1.5 text-sm bg-accent text-accent-foreground border border-border px-3 py-1.5 rounded-md hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-60"
                  >
                    {isGeneratingAI[page.pageIndex] ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    AI Viết thoại
                  </button>
                </div>
                <div className="space-y-3 flex-1">
                  <div className="p-4 rounded-lg border border-border bg-background shadow-sm">
                    <label className="text-[10px] uppercase font-bold tracking-wider mb-1 block text-muted-foreground">
                      Lời thoại trang {page.pageIndex}
                    </label>
                    <textarea
                      className="w-full text-sm border border-border bg-input rounded-md p-2 focus:ring-2 focus:ring-ring outline-none resize-none min-h-[80px]"
                      placeholder="Nhập lời thoại cho trang này..."
                      value={page.text}
                      onChange={(e) =>
                        updatePage(page.pageIndex, {
                          text: e.target.value,
                          audioUrl: undefined,
                          duration: undefined,
                        })
                      }
                    />
                    {page.audioUrl && (
                      <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted">
                        <Play size={14} className="text-green-600 fill-current" />
                        <audio
                          controls
                          src={page.audioUrl}
                          className="h-6 w-full opacity-90"
                        />
                        <span className="text-xs whitespace-nowrap font-mono text-muted-foreground">
                          {page.duration ? `${page.duration.toFixed(1)}s` : ""}
                        </span>
                      </div>
                    )}
                    <div className="mt-3 flex justify-between items-center border-t border-border pt-3">
                      <button
                        onClick={() => handleGenAudio(page.pageIndex)}
                        disabled={page.isLoading || !page.text.trim()}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded transition-all ${
                          page.audioUrl
                            ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                        } disabled:opacity-50`}
                      >
                        {page.isLoading ? (
                          <Loader2 className="animate-spin h-3 w-3" />
                        ) : (
                          <Mic size={14} />
                        )}
                        {page.audioUrl ? "Tạo lại audio" : "Tạo audio"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <ConfirmationDialog
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
        onConfirm={confirmation.onConfirm}
        title={confirmation.title}
        description={confirmation.description}
      />
    </div>
  );
};

export default ReviewEditor;
