import { PartialType } from '@nestjs/swagger';
import { CreateSupabaseDto } from './create-supabase.dto';

export class UpdateSupabaseDto extends PartialType(CreateSupabaseDto) {}
