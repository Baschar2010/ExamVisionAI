import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { safeFilename } from './file-naming.ts';

export const NATIVE_EXPORT_DIRECTORY = 'exports';

export type SavedFile = {
  name: string;
  path: string;
  uri: string;
  shared: boolean;
  error?: string;
};

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return bytesToBase64(new Uint8Array(await blob.arrayBuffer()));
}

function webDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function shareNativeFile(name: string, path: string, dialogTitle?: string): Promise<{ uri: string; shared: boolean; error?: string }> {
  const { uri } = await Filesystem.getUri({ path, directory: Directory.Data });
  try {
    await Share.share({
      files: [uri],
      title: name,
      dialogTitle: dialogTitle || name,
    });
    return { uri, shared: true };
  } catch (error) {
    return {
      uri,
      shared: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function saveBlobFile(
  blob: Blob,
  filename: string,
  options: { share?: boolean; dialogTitle?: string } = {},
): Promise<SavedFile> {
  const name = safeFilename(filename, 140);
  if (!isNativePlatform()) {
    webDownload(blob, name);
    return { name, path: '', uri: '', shared: false };
  }
  const path = `${NATIVE_EXPORT_DIRECTORY}/${name}`;
  const data = await blobToBase64(blob);
  await Filesystem.writeFile({ path, data, directory: Directory.Data, recursive: true });
  if (options.share === false) {
    const { uri } = await Filesystem.getUri({ path, directory: Directory.Data });
    return { name, path, uri, shared: false };
  }
  const shared = await shareNativeFile(name, path, options.dialogTitle);
  return { name, path, ...shared };
}

export async function saveTextFile(
  filename: string,
  text: string,
  mime = 'application/json',
  options: { share?: boolean; dialogTitle?: string } = {},
): Promise<SavedFile> {
  return saveBlobFile(new Blob([text], { type: `${mime};charset=utf-8` }), filename, options);
}

export async function saveBytesFile(
  bytes: ArrayBuffer | Uint8Array,
  filename: string,
  mime: string,
  options: { share?: boolean; dialogTitle?: string } = {},
): Promise<SavedFile> {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  return saveBlobFile(new Blob([buffer], { type: mime }), filename, options);
}
