import React, { useState, useRef } from "react";
import { useWorkspaceStore } from "../../store/workspaceStore.ts";
import { useChatStore } from "../../store/chatStore.ts";
import { useToast } from "../Toast.tsx";
import { WorkspaceFile } from "../../../shared/types.ts";
import {
  FileText,
  UploadCloud,
  FileCode,
  Image as ImageIcon,
  Film,
  FileSpreadsheet,
  Download,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Folder,
  X,
  ExternalLink,
} from "lucide-react";

interface UploadingItem {
  id: string;
  name: string;
  sizeBytes: number;
  progress: number;
  status: "uploading" | "success" | "error";
}

export default function FilesView() {
  const { files, createFileEntry, activeWorkspace, projects } = useWorkspaceStore();
  const { user } = useChatStore();
  const { addToast } = useToast();

  const [activeCategory, setActiveCategory] = useState<"ALL" | "DOCS" | "IMAGES" | "SHEETS" | "CODE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadingItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered files
  const filteredFiles = files.filter((file) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!file.name.toLowerCase().includes(q)) return false;
    }
    if (activeCategory === "DOCS") {
      return (
        file.file_type.includes("pdf") ||
        file.file_type.includes("doc") ||
        file.file_type.includes("txt") ||
        file.file_type.includes("text")
      );
    }
    if (activeCategory === "IMAGES") {
      return file.file_type.includes("image") || file.file_type.includes("png") || file.file_type.includes("jpg");
    }
    if (activeCategory === "SHEETS") {
      return file.file_type.includes("sheet") || file.file_type.includes("csv") || file.file_type.includes("excel");
    }
    if (activeCategory === "CODE") {
      return (
        file.file_type.includes("json") ||
        file.file_type.includes("javascript") ||
        file.file_type.includes("typescript") ||
        file.file_type.includes("code")
      );
    }
    return true;
  });

  const simulateUpload = (fileObj: { name: string; size: number; type: string }) => {
    const uploadId = Math.random().toString(36).substring(2, 9);
    const newUpload: UploadingItem = {
      id: uploadId,
      name: fileObj.name,
      sizeBytes: fileObj.size,
      progress: 0,
      status: "uploading",
    };

    setUploadQueue((prev) => [newUpload, ...prev]);

    let curr = 0;
    const interval = setInterval(() => {
      curr += 25;
      if (curr >= 100) {
        clearInterval(interval);
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === uploadId ? { ...item, progress: 100, status: "success" } : item
          )
        );

        // Save file entry to store
        createFileEntry(
          fileObj.name,
          fileObj.type || "application/octet-stream",
          fileObj.size,
          `#file-${uploadId}`
        );
        addToast(`Uploaded "${fileObj.name}" successfully`, "success");

        // Clean up upload item after 3s
        setTimeout(() => {
          setUploadQueue((prev) => prev.filter((i) => i.id !== uploadId));
        }, 3000);
      } else {
        setUploadQueue((prev) =>
          prev.map((item) => (item.id === uploadId ? { ...item, progress: curr } : item))
        );
      }
    }, 280);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file: File) => {
        simulateUpload({ name: file.name, size: file.size, type: file.type });
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file: File) => {
        simulateUpload({ name: file.name, size: file.size, type: file.type });
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("image")) return <ImageIcon className="h-5 w-5 text-emerald-400" />;
    if (fileType.includes("sheet") || fileType.includes("csv"))
      return <FileSpreadsheet className="h-5 w-5 text-emerald-400" />;
    if (fileType.includes("code") || fileType.includes("json"))
      return <FileCode className="h-5 w-5 text-cyan-400" />;
    if (fileType.includes("video")) return <Film className="h-5 w-5 text-purple-400" />;
    return <FileText className="h-5 w-5 text-brand-400" />;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/50 space-y-4 shrink-0 select-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Folder className="h-5 w-5 text-brand-400" />
              Workspace Files & Assets
            </h1>
            <p className="text-xs text-slate-400">
              Shared documentation, design assets, sprint sheets, and project files.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              multiple
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-interactive px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-brand-500/20 transition cursor-pointer"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload File</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setActiveCategory("ALL")}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                activeCategory === "ALL"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({files.length})
            </button>
            <button
              onClick={() => setActiveCategory("DOCS")}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                activeCategory === "DOCS"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Docs
            </button>
            <button
              onClick={() => setActiveCategory("IMAGES")}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                activeCategory === "IMAGES"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Images
            </button>
            <button
              onClick={() => setActiveCategory("SHEETS")}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                activeCategory === "SHEETS"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sheets
            </button>
            <button
              onClick={() => setActiveCategory("CODE")}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                activeCategory === "CODE"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Code
            </button>
          </div>

          <div className="relative min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Main Files Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
            isDragging
              ? "border-brand-400 bg-brand-500/10 scale-[1.005]"
              : "border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/50"
          }`}
        >
          <UploadCloud className="h-8 w-8 text-slate-500 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-200">
            Drag and drop team files here, or <span className="text-brand-400 underline">browse</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Supports documents, design assets, spreadsheets, and zip archives up to 100MB
          </p>
        </div>

        {/* Upload Progress Queue */}
        {uploadQueue.length > 0 && (
          <div className="space-y-2 animate-fade-in">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Uploads ({uploadQueue.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {uploadQueue.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 truncate pr-2">
                      {item.name}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {item.progress}%
                    </span>
                  </div>

                  {/* Smooth Progress Bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full progress-bar-smooth ${
                        item.status === "error"
                          ? "bg-rose-500"
                          : item.progress === 100
                          ? "bg-emerald-500"
                          : "bg-brand-500"
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{formatBytes(item.sizeBytes)}</span>
                    {item.status === "success" ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </span>
                    ) : (
                      <span>Uploading...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Repository Items ({filteredFiles.length})</span>
          </div>

          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 space-y-2 text-slate-500">
              <FileText className="h-8 w-8 mx-auto text-slate-600" />
              <p className="text-xs">No files match your filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="card-hover-lift group p-4 rounded-xl bg-slate-900 border border-slate-800/90 hover:border-slate-700 flex flex-col justify-between space-y-3 shadow-sm select-none"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 shrink-0">
                      {getFileIcon(file.file_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-slate-100 truncate group-hover:text-brand-300 transition">
                        {file.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {formatBytes(file.size_bytes)} • {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500">
                      By {file.uploader?.display_name || "Member"}
                    </span>

                    <button
                      onClick={() => addToast(`Downloading ${file.name}...`, "info")}
                      className="btn-interactive p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition cursor-pointer"
                      title="Download file"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
