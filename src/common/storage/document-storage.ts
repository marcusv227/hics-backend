import { randomUUID } from 'crypto';
import { createReadStream, promises as fs } from 'fs';
import type { Readable } from 'stream';
import * as path from 'path';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export interface StoredDocument {
  key: string;
  mime: string;
  sizeBytes: number;
}

export interface DocumentStorage {
  save(buffer: Buffer, opts: { subDir: string; originalName: string; mime: string }): Promise<StoredDocument>;
  getReadStream(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
}

const EXTENSION_BY_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

function buildKey(subDir: string, originalName: string, mime: string): { key: string; fileName: string } {
  const ext = EXTENSION_BY_MIME[mime] ?? path.extname(originalName) ?? '';
  const fileName = `${randomUUID()}${ext}`;
  return { key: path.join(subDir, fileName), fileName };
}

/**
 * Dev/no-Docker fallback: stores files on local disk, outside any
 * statically-served directory (this app does not serve /storage at all).
 * Used automatically when no S3_ENDPOINT is configured.
 */
export class LocalDiskDocumentStorage implements DocumentStorage {
  private readonly root = path.resolve(process.cwd(), 'storage');

  async save(buffer: Buffer, opts: { subDir: string; originalName: string; mime: string }): Promise<StoredDocument> {
    const { key, fileName } = buildKey(opts.subDir, opts.originalName, opts.mime);
    const absoluteDir = path.join(this.root, opts.subDir);
    await fs.mkdir(absoluteDir, { recursive: true });
    await fs.writeFile(path.join(absoluteDir, fileName), buffer);
    return { key, mime: opts.mime, sizeBytes: buffer.length };
  }

  async getReadStream(key: string): Promise<Readable> {
    return createReadStream(path.join(this.root, key));
  }

  async delete(key: string): Promise<void> {
    await fs.rm(path.join(this.root, key), { force: true });
  }
}

export interface S3StorageConfig {
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

/**
 * S3-compatible storage (MinIO fork — see docker-compose.yml). The bucket
 * is private and reached only from inside the Docker network; end users
 * never get a direct URL to it (see DocumentAccessController), so there's
 * no need for presigned URLs here — just plain get/put/delete.
 */
export class S3DocumentStorage implements DocumentStorage {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      forcePathStyle: true, // required for MinIO-style endpoints (no virtual-hosted buckets)
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });
  }

  async save(buffer: Buffer, opts: { subDir: string; originalName: string; mime: string }): Promise<StoredDocument> {
    const { key } = buildKey(opts.subDir, opts.originalName, opts.mime);
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: opts.mime }),
    );
    return { key, mime: opts.mime, sizeBytes: buffer.length };
  }

  async getReadStream(key: string): Promise<Readable> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    return result.Body as Readable;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
