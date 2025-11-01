import { IsString, IsNumber, IsOptional, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetTestDto {
  @IsString()
  testCode: string;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  variant: number;
}

export class TestResponseDto {
  id: number;
  testCode: string;
  testTitle: string;
  variant: number;
  questions: any;
  createdAt: Date | null;
}

export class CreateTestDto {
  @IsString()
  testCode: string;

  @IsString()
  testTitle: string;

  @IsNumber()
  variant: number;

  @IsObject()
  questions: any;
}
