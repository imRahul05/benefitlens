export const SUPPORTED_UPLOAD_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
] as const;

export const SUPPORTED_UPLOAD_ACCEPT = SUPPORTED_UPLOAD_EXTENSIONS.join(",");
export const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export type UploadFileValidationResult =
  | { valid: true }
  | {
      valid: false;
      reason: "unsupported-type" | "too-large";
      message: string;
    };

export function getFileExtension(fileName: string) {
  const extensionStart = fileName.lastIndexOf(".");
  return extensionStart === -1 ? "" : fileName.substring(extensionStart).toLowerCase();
}

export function validateUploadFile(
  file: Pick<File, "name" | "size">,
): UploadFileValidationResult {
  const extension = getFileExtension(file.name);

  if (!(SUPPORTED_UPLOAD_EXTENSIONS as readonly string[]).includes(extension)) {
    return {
      valid: false,
      reason: "unsupported-type",
      message:
        "Invalid file type! Supported formats: PDF, DOCX, TXT, and Images (PNG, JPG, WEBP).",
    };
  }

  if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
    return {
      valid: false,
      reason: "too-large",
      message: "File is too large! Maximum limit is 10MB.",
    };
  }

  return { valid: true };
}
