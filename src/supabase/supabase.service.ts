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

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly supabase;
  private readonly bucket = SUPABASE_BUCKET;
  private readonly logger = new Logger(SupabaseService.name);

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
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

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const key = `${randomUUID()}${extname(file.originalname)}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(key, file.buffer, { contentType: file.mimetype });

    if (error) throw new InternalServerErrorException(error.message);

    return key;
  }

  getClient() {
    return this.supabase;
  }

  getBucket() {
    return this.bucket;
  }
}
