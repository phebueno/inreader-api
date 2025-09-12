import { PartialType } from '@nestjs/swagger';
import { CreateAiCompletionDto } from './create-ai-completion.dto';

export class UpdateAiCompletionDto extends PartialType(CreateAiCompletionDto) {}
