import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import {
  SUPABASE_BUCKET,
  SUPABASE_SERVICE_KEY,
  SUPABASE_URL,
} from '@/constants/constants';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly supabase;
  private readonly bucket = SUPABASE_BUCKET;
  private readonly logger = new Logger(SupabaseService.name);

  private static bucketChecked = false;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });
  }

  async onModuleInit() {
    if (!SupabaseService.bucketChecked) {
      await this.ensureBucketExists();
      SupabaseService.bucketChecked = true;
    }
  }

  async ensureBucketExists() {
    const { error } = await this.supabase.storage.createBucket(this.bucket);

    if (error) {
      if (error.message.includes('already exists')) {
        this.logger.log(
          `Bucket "${this.bucket}" already exists. Continuing normally.`,
        );
      } else {
        this.logger.error('Error creating bucket: ' + error.message);
        process.exit(1);
      }
    } else {
      this.logger.log(`Bucket "${this.bucket}" created successfully!`);
    }
  }

  @Cron('0 4 * * *')
  async keepDatabaseAlive() {
    this.logger.log('🔄 Daily Supabase keep-alive ping...');

    try {
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .list('', { limit: 1 });

      if (error) {
        this.logger.warn('⚠️ Failed to access Supabase bucket: ' + error.message);
      } else {
        this.logger.log('✅ Supabase Storage accessed successfully (keep-alive).');
      }
    } catch (err) {
      this.logger.error('❌ Unexpected error during keep-alive:', err);
    }
  }


  async uploadFile(file: Express.Multer.File): Promise<string> {
    const key = `${randomUUID()}${extname(file.originalname)}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(key, file.buffer, { contentType: file.mimetype });

    if (error) throw new InternalServerErrorException(error.message);

    return key;
  }

  async deleteFile(key: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([key]);

    if (error) {
      throw new InternalServerErrorException(
        `Error deleting file "${key}": ${error.message}`,
      );
    }

    this.logger.log(`File "${key}" deleted successfully from bucket.`);
  }

  async downloadFile(key: string): Promise<Buffer> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .download(key);

    if (error) {
      throw new InternalServerErrorException(
        `Error downloading file "${key}": ${error.message}`,
      );
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    return buffer;
  }
}
