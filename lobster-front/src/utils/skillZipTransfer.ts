import { SkillConfig } from '../pages/skill/Editor/types';
import { SkillAssetPackage, parseSkillAssetPackage } from './assetTransfer';

const ZIP_METADATA_PATH = 'skill.json';
const ZIP_FILE_PREFIX = 'files/';
const ZIP_LOCAL_FILE_HEADER = 0x04034b50;
const ZIP_CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const ZIP_UTF8_FLAG = 0x0800;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
let crcTable: Uint32Array | null = null;

interface ZipEntry {
  name: string;
  data: Uint8Array;
  crc: number;
  offset: number;
}

function getCrcTable(): Uint32Array {
  if (crcTable) {
    return crcTable;
  }
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    table[i] = value >>> 0;
  }
  crcTable = table;
  return table;
}

function crc32(data: Uint8Array): number {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value, true);
}

function writeUint32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value >>> 0, true);
}

function concatChunks(chunks: Uint8Array[]): Uint8Array {
  const length = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

function sanitizeZipPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+/, '').split('/').filter((part) => part && part !== '.' && part !== '..').join('/');
}

function makeLocalHeader(entry: ZipEntry): Uint8Array {
  const name = encoder.encode(entry.name);
  const header = new Uint8Array(30 + name.byteLength);
  const view = new DataView(header.buffer);
  writeUint32(view, 0, ZIP_LOCAL_FILE_HEADER);
  writeUint16(view, 4, 20);
  writeUint16(view, 6, ZIP_UTF8_FLAG);
  writeUint16(view, 8, 0);
  writeUint16(view, 10, 0);
  writeUint16(view, 12, 0);
  writeUint32(view, 14, entry.crc);
  writeUint32(view, 18, entry.data.byteLength);
  writeUint32(view, 22, entry.data.byteLength);
  writeUint16(view, 26, name.byteLength);
  writeUint16(view, 28, 0);
  header.set(name, 30);
  return header;
}

function makeCentralDirectoryHeader(entry: ZipEntry): Uint8Array {
  const name = encoder.encode(entry.name);
  const header = new Uint8Array(46 + name.byteLength);
  const view = new DataView(header.buffer);
  writeUint32(view, 0, ZIP_CENTRAL_DIRECTORY_HEADER);
  writeUint16(view, 4, 20);
  writeUint16(view, 6, 20);
  writeUint16(view, 8, ZIP_UTF8_FLAG);
  writeUint16(view, 10, 0);
  writeUint16(view, 12, 0);
  writeUint16(view, 14, 0);
  writeUint32(view, 16, entry.crc);
  writeUint32(view, 20, entry.data.byteLength);
  writeUint32(view, 24, entry.data.byteLength);
  writeUint16(view, 28, name.byteLength);
  writeUint16(view, 30, 0);
  writeUint16(view, 32, 0);
  writeUint16(view, 34, 0);
  writeUint16(view, 36, 0);
  writeUint32(view, 38, 0);
  writeUint32(view, 42, entry.offset);
  header.set(name, 46);
  return header;
}

function makeEndRecord(entryCount: number, centralDirectorySize: number, centralDirectoryOffset: number): Uint8Array {
  const record = new Uint8Array(22);
  const view = new DataView(record.buffer);
  writeUint32(view, 0, ZIP_END_OF_CENTRAL_DIRECTORY);
  writeUint16(view, 4, 0);
  writeUint16(view, 6, 0);
  writeUint16(view, 8, entryCount);
  writeUint16(view, 10, entryCount);
  writeUint32(view, 12, centralDirectorySize);
  writeUint32(view, 16, centralDirectoryOffset);
  writeUint16(view, 20, 0);
  return record;
}

function buildZip(entries: Array<{ name: string; content: string }>): Uint8Array {
  const zipEntries: ZipEntry[] = entries.map((entry) => {
    const data = encoder.encode(entry.content);
    return {
      name: sanitizeZipPath(entry.name),
      data,
      crc: crc32(data),
      offset: 0,
    };
  });
  const chunks: Uint8Array[] = [];
  let offset = 0;
  for (const entry of zipEntries) {
    entry.offset = offset;
    const header = makeLocalHeader(entry);
    chunks.push(header, entry.data);
    offset += header.byteLength + entry.data.byteLength;
  }
  const centralDirectoryOffset = offset;
  const centralHeaders = zipEntries.map(makeCentralDirectoryHeader);
  for (const header of centralHeaders) {
    chunks.push(header);
    offset += header.byteLength;
  }
  chunks.push(makeEndRecord(zipEntries.length, offset - centralDirectoryOffset, centralDirectoryOffset));
  return concatChunks(chunks);
}

async function toUint8Array(value: Uint8Array | ArrayBuffer | Blob): Promise<Uint8Array> {
  if (value instanceof Uint8Array) {
    return value;
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  }
  return new Uint8Array(await value.arrayBuffer());
}

function readUint16(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

function readUint32(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

function parseZipEntries(data: Uint8Array): Map<string, string> {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const result = new Map<string, string>();
  let offset = 0;
  while (offset + 30 <= data.byteLength) {
    const signature = readUint32(view, offset);
    if (signature === ZIP_CENTRAL_DIRECTORY_HEADER || signature === ZIP_END_OF_CENTRAL_DIRECTORY) {
      break;
    }
    if (signature !== ZIP_LOCAL_FILE_HEADER) {
      throw new Error('Invalid skill zip package');
    }
    const method = readUint16(view, offset + 8);
    if (method !== 0) {
      throw new Error('Unsupported compressed skill zip package');
    }
    const compressedSize = readUint32(view, offset + 18);
    const filenameLength = readUint16(view, offset + 26);
    const extraLength = readUint16(view, offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + filenameLength;
    const contentStart = nameEnd + extraLength;
    const contentEnd = contentStart + compressedSize;
    if (contentEnd > data.byteLength) {
      throw new Error('Invalid skill zip package');
    }
    const name = decoder.decode(data.slice(nameStart, nameEnd));
    if (!name.endsWith('/')) {
      result.set(name, decoder.decode(data.slice(contentStart, contentEnd)));
    }
    offset = contentEnd;
  }
  return result;
}

function skillZipMetadata(skill: SkillConfig) {
  return {
    kind: 'lobster.skill-package',
    version: 1,
    exportedAt: new Date().toISOString(),
    skill: {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      icon: skill.icon,
      version: skill.version,
      visibility: skill.visibility,
      publishStatus: skill.publishStatus,
      runtimeEnvironments: skill.runtimeEnvironments || [],
      coreCapabilities: skill.coreCapabilities || [],
      files: skill.files.map((file) => ({
        id: file.id,
        parentId: file.parentId,
        nodeType: file.nodeType || 'file',
        name: file.name,
        path: file.path || file.name,
        language: file.language,
        sortOrder: file.sortOrder,
      })),
    },
  };
}

export function buildSkillZipPackage(skill: SkillConfig): Uint8Array {
  const entries = [
    { name: ZIP_METADATA_PATH, content: JSON.stringify(skillZipMetadata(skill), null, 2) },
    ...skill.files
      .filter((file) => (file.nodeType || 'file') !== 'folder')
      .map((file) => ({
        name: `${ZIP_FILE_PREFIX}${sanitizeZipPath(file.path || file.name)}`,
        content: file.content || '',
      })),
  ];
  return buildZip(entries);
}

export async function parseSkillZipPackage(value: Uint8Array | ArrayBuffer | Blob): Promise<SkillAssetPackage> {
  const entries = parseZipEntries(await toUint8Array(value));
  const rawMetadata = entries.get(ZIP_METADATA_PATH);
  if (!rawMetadata) {
    throw new Error('Invalid skill zip package');
  }
  const metadata = JSON.parse(rawMetadata) as unknown;
  const parsed = parseSkillAssetPackage(metadata);
  const files = parsed.skill.files.map((file) => {
    if ((file.nodeType || 'file') === 'folder') {
      return file;
    }
    const path = sanitizeZipPath(file.path || file.name);
    return {
      ...file,
      path,
      name: path,
      content: entries.get(`${ZIP_FILE_PREFIX}${path}`) ?? file.content ?? '',
    };
  });
  return {
    ...parsed,
    skill: {
      ...parsed.skill,
      files,
    },
  };
}
